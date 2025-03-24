interface HamburgerProps {
  isOpen: boolean;
  toggleMenu: () => void;
}

const Hamburger = ({ isOpen, toggleMenu }: HamburgerProps) => {
  return (
    <button
      onClick={toggleMenu}
      className="lg:hidden flex flex-col justify-center items-center w-6 h-6"
      aria-label="Toggle menu"
    >
      <span className={`block w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
      <span className={`block w-6 h-0.5 bg-gray-600 dark:bg-gray-300 my-1 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
      <span className={`block w-6 h-0.5 bg-gray-600 dark:bg-gray-300 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
    </button>
  );
};

export default Hamburger;
