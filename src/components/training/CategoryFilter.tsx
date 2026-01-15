interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryFilter = ({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) => {
  return (
    <div 
      className="flex items-center gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide"
      dir="rtl"
      role="tablist"
      aria-label="تصفية البرامج حسب الفئة"
    >
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full whitespace-nowrap font-hrsd-medium text-sm md:text-base transition-all duration-200 min-h-[44px] ${
            activeCategory === category
              ? "bg-primary text-white shadow-md"
              : "bg-white text-foreground hover:bg-primary/10 border border-border"
          }`}
          role="tab"
          aria-selected={activeCategory === category}
          aria-controls="training-programs-grid"
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
