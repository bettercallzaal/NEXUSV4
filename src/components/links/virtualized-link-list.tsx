"use client";

import { useState, useMemo, useCallback } from "react";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import Fuse from "fuse.js";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Search } from "@/components/ui/search";
import { Category, Link, LinksData } from "@/types/links";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface VirtualizedLinkListProps {
  data: LinksData;
}

interface FlattenedLink extends Link {
  category: string;
  subcategory: string;
  id: string;
}

export function VirtualizedLinkList({ data }: VirtualizedLinkListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"accordion" | "flat">("accordion");

  // Create a flattened array of all links for searching and virtualization
  const allLinks = useMemo(() => {
    const links: FlattenedLink[] = [];
    
    data.categories.forEach((category, catIndex) => {
      category.subcategories.forEach((subcategory, subIndex) => {
        subcategory.links.forEach((link, linkIndex) => {
          links.push({
            ...link,
            category: category.name,
            subcategory: subcategory.name,
            id: `${catIndex}-${subIndex}-${linkIndex}`,
          });
        });
      });
    });
    
    return links;
  }, [data]);
  
  // Set up Fuse.js for fuzzy searching
  const fuse = useMemo(() => {
    return new Fuse(allLinks, {
      keys: ["title", "description", "category", "subcategory"],
      threshold: 0.3,
      includeMatches: true,
    });
  }, [allLinks]);
  
  // Filter links based on search query and selected category/subcategory
  const filteredLinks = useMemo(() => {
    let result = allLinks;
    
    // Apply category filter if selected
    if (selectedCategory) {
      result = result.filter(link => link.category === selectedCategory);
      
      // Apply subcategory filter if selected
      if (selectedSubcategory) {
        result = result.filter(link => link.subcategory === selectedSubcategory);
      }
    }
    
    // Apply search filter if query exists
    if (searchQuery) {
      const searchResults = fuse.search(searchQuery);
      result = searchResults.map(res => res.item);
    }
    
    return result;
  }, [allLinks, fuse, searchQuery, selectedCategory, selectedSubcategory]);
  
  // Filter categories based on search query for accordion view
  const filteredCategories = useMemo(() => {
    if (!searchQuery && !selectedCategory) {
      return data.categories;
    }
    
    // Create a map to track which categories and subcategories have matches
    const categoryMap = new Map<string, Map<string, Set<string>>>();
    
    filteredLinks.forEach((item) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, new Map<string, Set<string>>());
      }
      
      const subcategoryMap = categoryMap.get(item.category)!;
      if (!subcategoryMap.has(item.subcategory)) {
        subcategoryMap.set(item.subcategory, new Set<string>());
      }
      
      subcategoryMap.get(item.subcategory)!.add(item.title);
    });
    
    // If a specific category is selected, only show that one
    if (selectedCategory) {
      const category = data.categories.find(c => c.name === selectedCategory);
      if (!category) return [];
      
      const subcategoryMap = categoryMap.get(selectedCategory);
      if (!subcategoryMap) return [];
      
      const filteredSubcategories = category.subcategories
        .map((subcategory) => {
          // If a specific subcategory is selected, only show that one
          if (selectedSubcategory && subcategory.name !== selectedSubcategory) {
            return null;
          }
          
          const linkTitles = subcategoryMap.get(subcategory.name);
          if (!linkTitles && searchQuery) return null;
          
          return {
            ...subcategory,
            links: searchQuery 
              ? subcategory.links.filter((link) => linkTitles?.has(link.title))
              : subcategory.links,
          };
        })
        .filter(Boolean) as typeof category.subcategories;
      
      if (filteredSubcategories.length === 0) return [];
      
      return [{
        ...category,
        subcategories: filteredSubcategories,
      }];
    }
    
    // Build filtered categories based on search results
    return data.categories
      .map((category) => {
        const subcategoryMap = categoryMap.get(category.name);
        if (!subcategoryMap) return null;
        
        const filteredSubcategories = category.subcategories
          .map((subcategory) => {
            const linkTitles = subcategoryMap.get(subcategory.name);
            if (!linkTitles) return null;
            
            return {
              ...subcategory,
              links: subcategory.links.filter((link) => linkTitles.has(link.title)),
            };
          })
          .filter(Boolean) as typeof category.subcategories;
        
        if (filteredSubcategories.length === 0) return null;
        
        return {
          ...category,
          subcategories: filteredSubcategories,
        };
      })
      .filter(Boolean) as Category[];
  }, [data.categories, filteredLinks, searchQuery, selectedCategory, selectedSubcategory]);

  // Handle category toggle in accordion view
  const toggleCategory = useCallback((categoryName: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  }, []);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryName: string | null) => {
    setSelectedCategory(categoryName);
    setSelectedSubcategory(null);
    
    // Expand the selected category in accordion view
    if (categoryName && !expandedCategories.includes(categoryName)) {
      setExpandedCategories(prev => [...prev, categoryName]);
    }
  }, [expandedCategories]);

  // Handle subcategory selection
  const handleSubcategorySelect = useCallback((subcategoryName: string | null) => {
    setSelectedSubcategory(subcategoryName);
  }, []);

  // Render a single link item in flat view
  const LinkItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const link = filteredLinks[index];
    return (
      <div style={style} className="px-4">
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start p-3 rounded-md hover:bg-accent group border border-border my-1"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium group-hover:underline">
                {link.title}
              </h4>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full text-primary">
                {link.category}
              </span>
              <span className="text-xs bg-secondary/20 px-2 py-0.5 rounded-full text-secondary-foreground">
                {link.subcategory}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {link.description}
            </p>
          </div>
        </a>
      </div>
    );
  }, [filteredLinks]);

  // Generate category and subcategory filters
  const categoryFilters = useMemo(() => {
    const categories = data.categories.map(cat => cat.name);
    return categories;
  }, [data.categories]);

  const subcategoryFilters = useMemo(() => {
    if (!selectedCategory) return [];
    const category = data.categories.find(cat => cat.name === selectedCategory);
    return category ? category.subcategories.map(subcat => subcat.name) : [];
  }, [data.categories, selectedCategory]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4">
        <Search 
          onSearch={setSearchQuery} 
          placeholder="Search for links, categories, or descriptions..." 
          className="mx-auto"
        />
        
        <div className="flex flex-wrap gap-2 justify-center">
          <Button 
            variant={selectedCategory === null ? "default" : "outline"} 
            size="sm"
            onClick={() => handleCategorySelect(null)}
          >
            All Categories
          </Button>
          {categoryFilters.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategorySelect(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        
        {selectedCategory && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button 
              variant={selectedSubcategory === null ? "secondary" : "outline"} 
              size="sm"
              onClick={() => handleSubcategorySelect(null)}
            >
              All Subcategories
            </Button>
            {subcategoryFilters.map(subcategory => (
              <Button
                key={subcategory}
                variant={selectedSubcategory === subcategory ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleSubcategorySelect(subcategory)}
              >
                {subcategory}
              </Button>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-center mb-4">
        <Tabs defaultValue="accordion" onValueChange={(v: string) => setViewMode(v as "accordion" | "flat")}>
          <TabsList>
            <TabsTrigger value="accordion">Accordion View</TabsTrigger>
            <TabsTrigger value="flat">Flat View</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {filteredLinks.length} Links
              {selectedCategory && ` in ${selectedCategory}`}
              {selectedSubcategory && ` > ${selectedSubcategory}`}
            </h2>
          </div>
          
          {viewMode === "accordion" ? (
            filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No links found matching your search.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="w-full" value={expandedCategories}>
                {filteredCategories.map((category) => (
                  <AccordionItem key={category.name} value={category.name}>
                    <AccordionTrigger 
                      className="text-lg font-semibold"
                      onClick={() => toggleCategory(category.name)}
                    >
                      {category.name} ({category.subcategories.reduce((sum, subcat) => sum + subcat.links.length, 0)} links)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.name} className="space-y-2">
                            <h3 className="font-medium text-md">{subcategory.name} ({subcategory.links.length} links)</h3>
                            <div className="grid gap-2">
                              {subcategory.links.slice(0, 50).map((link) => (
                                <a
                                  key={link.url}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-start p-3 rounded-md hover:bg-accent group border border-border"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium group-hover:underline">
                                        {link.title}
                                      </h4>
                                      <ExternalLink className="h-3 w-3 opacity-70" />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {link.description}
                                    </p>
                                  </div>
                                </a>
                              ))}
                              {subcategory.links.length > 50 && (
                                <div className="text-center py-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedCategory(category.name);
                                      setSelectedSubcategory(subcategory.name);
                                      setViewMode("flat");
                                    }}
                                  >
                                    View all {subcategory.links.length} links
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )
          ) : (
            <div className="h-[600px] w-full">
              {filteredLinks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No links found matching your search.</p>
                </div>
              ) : (
                <AutoSizer>
                  {({ height, width }) => (
                    <List
                      height={height}
                      width={width}
                      itemCount={filteredLinks.length}
                      itemSize={120}
                    >
                      {LinkItem}
                    </List>
                  )}
                </AutoSizer>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
