

export default function Footer() {

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 py-4 mt-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-0">
          &copy; {new Date().getFullYear()} BBS - Bright Bee School. Todos os direitos reservados.
        </p>
        <div className="flex space-x-4">
        </div>
      </div>
    </footer>
  );
}