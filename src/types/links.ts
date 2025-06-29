export interface Link {
  title: string;
  url: string;
  description: string;
}

export interface Subcategory {
  name: string;
  links: Link[];
}

export interface Category {
  name: string;
  subcategories: Subcategory[];
}

export interface LinksData {
  categories: Category[];
}
