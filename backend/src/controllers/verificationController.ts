import fs from 'fs';
import csv from 'csv-parser';
import pdfParse from 'pdf-parse';
import { Request, Response } from 'express';
import Participant from '../models/Participant';
import { storeParticipants } from './participantController';
import { logActivity } from './activityController';

export interface PhonePeTransaction {
  date: string;
  utrId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
}

export interface ParticipantData {
  id: number;
  name: string;
  email: string;
  phone: string;
  utrId: string;
  amount: number;
  verified: boolean;
}

// Extract UTRs and amounts from PhonePe PDF statement
export async function extractTransactionsFromPDF(pdfPath: string): Promise<PhonePeTransaction[]> {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    const text = data.text;

    console.log('PDF Text Length:', text.length);
    
    // Store unique UTR IDs to prevent duplicates
    const uniqueUTRs = new Set<string>();
    const transactions: PhonePeTransaction[] = [];
    
    // More specific regex for PhonePe statement format
    // Format: date, transaction details with UTR No. XXXXXXXXXXXX, type, amount
    const transactionRegex = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})[\s\S]{1,150}?UTR No\.\s+([A-Za-z0-9]+)[\s\S]{1,100}?(CREDIT|DEBIT)[\s\S]{1,100}?(?:₹|Rs\.?)\s*([0-9,.]+)/gi;
    
    let match;
    while ((match = transactionRegex.exec(text)) !== null) {
      const dateStr = match[1].trim();
      const utrId = match[2].trim();
      const type = match[3].toUpperCase() as 'CREDIT' | 'DEBIT';
      const amountStr = match[4].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      
      // Only add the transaction if we haven't seen this UTR before
      if (!isNaN(amount) && !uniqueUTRs.has(utrId)) {
        uniqueUTRs.add(utrId);
        transactions.push({
          date: dateStr,
          utrId,
          amount,
          type
        });
        console.log(`Found transaction: UTR=${utrId}, Amount=${amount}, Type=${type}`);
      }
    }

    // If no transactions found, try a more focused approach
    if (transactions.length === 0) {
      console.log('No transactions found with primary regex, trying fallback method');
      
      // Look specifically for UTR numbers
      const utrMatches = text.match(/UTR No\.\s+([A-Za-z0-9]+)/gi) || [];
      const transactionLines: string[] = text.split('\n').filter((line: string): boolean => 
          line.includes('CREDIT') || line.includes('DEBIT')
      );
      
      console.log(`Found ${utrMatches.length} UTR matches and ${transactionLines.length} transaction lines`);
      
      for (const utrMatch of utrMatches) {
        const utrId = utrMatch.replace(/UTR No\.\s+/i, '').trim();
        
        if (uniqueUTRs.has(utrId)) continue;
        uniqueUTRs.add(utrId);
        
        // Find a transaction line that might correspond to this UTR
        const transactionLine = transactionLines.find(line => {
          // Simple heuristic: check if the line appears within 5 lines of the UTR in the PDF
          const utrIndex = text.indexOf(utrMatch);
          const lineIndex = text.indexOf(line);
          return Math.abs(text.substring(utrIndex, lineIndex).split('\n').length) < 5;
        });
        
        if (transactionLine) {
          // Extract amount from the transaction line
          const amountMatch = transactionLine.match(/(?:₹|Rs\.?)\s*([0-9,.]+)/);
          if (amountMatch) {
            const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            const type = transactionLine.includes('CREDIT') ? 'CREDIT' : 'DEBIT';
            
            transactions.push({
              date: new Date().toISOString().split('T')[0],
              utrId,
              amount,
              type
            });
            console.log(`Found transaction (fallback): UTR=${utrId}, Amount=${amount}, Type=${type}`);
          }
        }
      }
    }

    console.log(`Extracted ${transactions.length} unique transactions from PDF`);
    return transactions;
  } catch (error) {
    console.error('Error extracting transactions from PDF:', error);
    throw new Error('Failed to extract transactions from PDF');
  }
}

// Parse participants data from CSV
export function parseParticipantsCSV(csvPath: string): Promise<ParticipantData[]> {
  return new Promise((resolve, reject) => {
    const participants: ParticipantData[] = [];
    let id = 1;
    let headers: string[] = [];
    let firstRow = true;

    fs.createReadStream(csvPath)
      .pipe(csv({ 
          trim: true, 
          mapHeaders: ({ header }: { header: string }) => header.trim() 
      } as any))
      .on('data', (row) => {
        // Log the first row to debug CSV structure
        if (firstRow) {
          console.log('CSV first row:', row);
          headers = Object.keys(row).map(header => header.trim());
          console.log('CSV headers:', headers);
          firstRow = false;
        }
        
        // Find the appropriate column names regardless of case
        const nameColumn = findColumn(headers, ['name', 'participant name']);
        const emailColumn = findColumn(headers, ['email', 'e-mail']);
        const phoneColumn = findColumn(headers, ['phone', 'phone number', 'mobile']);
        const utrColumn = findColumn(headers, ['utr', 'utr id', 'transaction id', 'reference']);
        const amountColumn = findColumn(headers, ['amount', 'payment', 'fee']);

        // Extract values using the identified column names and trim them
        const name = nameColumn ? row[nameColumn].trim() : '';
        const email = emailColumn ? row[emailColumn].trim() : '';
        const phone = phoneColumn ? row[phoneColumn].trim() : '';
        
        // Handle UTR ID - Convert from scientific notation if needed
        let utrId = utrColumn ? row[utrColumn].trim() : '';
        let originalUtrId = utrId; // Save original for logging
        
        if (utrId && utrId.includes('E+')) {
          try {
            // More accurate scientific notation parsing
            const [base, exponent] = utrId.split('E+');
            const baseNum = parseFloat(base);
            const exp = parseInt(exponent || '0');
            
            if (!isNaN(baseNum) && !isNaN(exp)) {
              // Get significant digits from the base number
              const baseStr = baseNum.toString().replace('.', '');
              // Calculate the actual number length
              const totalLength = baseStr.length + (exp - (baseStr.length - 1));
              // Create the full number with correct length
              utrId = baseStr.padEnd(totalLength, '0');
              console.log(`Converted UTR from ${originalUtrId} to ${utrId} (scientific notation)`);
            } else {
              // Fallback conversion
              utrId = Number(utrId).toFixed(0);
              console.log(`Fallback conversion of UTR from ${originalUtrId} to ${utrId}`);
            }
          } catch (error) {
            console.error(`Failed to convert UTR from scientific notation: ${originalUtrId}`, error);
          }
        }
        
        const amountValue = amountColumn ? row[amountColumn].trim() : '0';
        const amount = parseFloat(amountValue.replace(/[^0-9.]/g, ''));

        console.log(`Parsing participant: name=${name}, email=${email}, utrId=${utrId}, amount=${amount}`);

        if (name || email || phone || utrId) {
          participants.push({
            id: id++,
            name: name || '(No Name)',
            email: email || '(No Email)',
            phone: phone || '(No Phone)',
            utrId: utrId || '(No UTR)',
            amount: isNaN(amount) ? 0 : amount,
            verified: false
          });
        }
      })
      .on('end', () => {
        console.log(`Parsed ${participants.length} participants from CSV`);
        resolve(participants);
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      });
  });
}

// Helper function to find columns in CSV headers
function findColumn(headers: string[], possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    const match = headers.find(h =>
      h.trim().toLowerCase() === name.toLowerCase() ||
      h.trim().toLowerCase().includes(name.toLowerCase())
    );
    if (match) return match.trim();
  }
  return null;
}

// Main verification logic
export async function verifyPayments(phonepeFilePath: string, participantsFilePath: string, expectedAmount: number) {
  try {
    // Extract transactions from PhonePe PDF
    const transactions = await extractTransactionsFromPDF(phonepeFilePath);
    
    // Extract CREDIT transactions only - we're only matching with credit transactions
    const creditTransactions = transactions.filter(t => t.type === 'CREDIT');
    console.log(`Found ${creditTransactions.length} credit transactions`);

    // Parse participants data from CSV
    const participants = await parseParticipantsCSV(participantsFilePath);

    // Verify each participant
    participants.forEach(participant => {
      console.log(`Verifying participant: ${participant.name}, UTR: ${participant.utrId}`);
      
      // Find exact matching transaction by UTR ID (case-insensitive)
      const matchingTransaction = creditTransactions.find(t => 
        t.utrId.toLowerCase() === participant.utrId.toLowerCase()
      );

      if (!matchingTransaction) {
        console.log('Available credit transactions:');
        creditTransactions.forEach(t => {
          console.log(`  Transaction UTR: ${t.utrId}, Amount: ${t.amount}`);
        });
        console.log(`No matching transaction found for UTR: ${participant.utrId}`);
      } else {
        console.log(`Found matching transaction: UTR=${matchingTransaction.utrId}, Amount=${matchingTransaction.amount}`);
        
        // Mark as verified if UTR exists and amount matches the expected amount
        const amountMatches = Math.abs(matchingTransaction.amount - expectedAmount) < 0.01;
        participant.verified = amountMatches;
        
        if (amountMatches) {
          console.log(`Verified participant: ${participant.name}`);
        } else {
          console.log(`Amount mismatch: Expected ${expectedAmount}, got ${matchingTransaction.amount}`);
        }
      }
    });

    // Store participants in MongoDB
    await storeParticipants(participants);

    const verifiedCount = participants.filter(p => p.verified).length;
    console.log(`Verification complete: ${verifiedCount} of ${participants.length} verified`);

    return {
      success: true,
      verifiedCount,
      totalCount: participants.length,
      participants
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
}



// Get verification results with search and sorting
export const getVerificationResults = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    // Get participants from database
    let query = Participant.find();
    
    // Apply search if provided
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query = query.or([
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
        { utrId: searchRegex }
      ]);
    }
    
    // Default sort by createdAt in descending order
    query = query.sort({ createdAt: -1 });
    
    const participants = await query.exec();
    
    const results: ParticipantData[] = participants.map((p) => ({
      id: p._id,
      name: p.name,
      email: p.email,
      phone: p.phoneNumber,
      utrId: p.utrId || '', 
      amount: p.amount, 
      verified: p.verified
    }));
    
    return res.status(200).json({
      success: true,
      verifiedCount: results.filter(p => p.verified).length,
      totalCount: results.length,
      pending: results.filter(p => !p.verified).length,
      participants: results
    });
  } catch (error) {
    console.error('Error fetching verification results:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};


// Update verification status for a participant - simplified version
export const updateVerificationStatus = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Participant ID is required' 
      });
    }
    console.log(`Setting verification to true for participant: ${id}`);
    
    const participant = await Participant.findById(id);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    participant.verified = true;
    await participant.save();
    
    // Log the activity
    await logActivity('Payment verified', participant.name);
    
    return res.status(200).json({ success: true, verified: true });
  } catch (error) {
    console.error('Error updating verification status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update verification status' });
  }
};

// Undo verification status for a participant
export const undoVerification = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Participant ID is required' 
      });
    }
    console.log(`Setting verification to false for participant: ${id}`);
    
    const participant = await Participant.findById(id);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found' });
    }
    participant.verified = false;
    await participant.save();
    
    // Log the activity
    await logActivity('Verification undone', participant.name);
    
    return res.status(200).json({ success: true, verified: false });
  } catch (error) {
    console.error('Error undoing verification status:', error);
    return res.status(500).json({ success: false, message: 'Failed to undo verification status' });
  }
};

export const deleteAllParticipants = async (req: Request, res: Response) => {
  try {
    await Participant.deleteMany({});
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting all participants:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete all participants' });
  }
}

