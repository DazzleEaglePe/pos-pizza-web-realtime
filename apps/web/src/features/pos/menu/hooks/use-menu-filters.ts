"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { apiFetch } from "@/lib/api";
import type { CatalogProduct, CatalogProductsPage, CatalogCategory, Promotion } from "../types";
import { COMBOS_CATEGORY_ID, PRODUCT_PAGE_SIZE, SEARCH_RESULTS_LIMIT } from "../types";

export interface UseMenuFiltersReturn {
  /* ── state ── */
  selectedCategoryId: string;
  setSelectedCategoryId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchFocused: boolean;
  setSearchFocused: (f: boolean) => void;
  sortBy: "default" | "name" | "price-asc" | "price-desc";
  setSortBy: (s: "default" | "name" | "price-asc" | "price-desc") => void;
  isComboView: boolean;
  showDropdown: boolean;
  /* ── products ── */
  products: CatalogProduct[];
  productsTotal: number;
  hasMoreProducts: boolean;
  isLoadingProducts: boolean;
  isLoadingMoreProducts: boolean;
  visibleProducts: CatalogProduct[];
  loadMoreProducts: () => void;
  /* ── search ── */
  searchResults: CatalogProduct[];
  clearSearch: () => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  /* ── categories helpers ── */
  categories: CatalogCategory[];
  totalProductCount: number;
  categoryMap: Map<string, string>;
  /* ── promotions ── */
  filteredPromos: Promotion[];
}

export function useMenuFilters(
  initialCategories: CatalogCategory[],
  promotions: Promotion[] = [],
): UseMenuFiltersReturn {
  const allCategory: CatalogCategory = useMemo(
    () => ({ id: "__all__", name: "Todos", icon: null }),
    [],
  );
  const categories = useMemo(
    () => [allCategory, ...initialCategories],
    [allCategory, initialCategories],
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "name" | "price-asc" | "price-desc">("default");
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsOffset, setProductsOffset] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingMoreProducts, setIsLoadingMoreProducts] = useState(false);
  const [searchResults, setSearchResults] = useState<CatalogProduct[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const isComboView = selectedCategoryId === COMBOS_CATEGORY_ID;
  const showDropdown = searchQuery.trim().length > 0 && searchFocused;

  /* ── fetch products (paginated) ── */
  const fetchProducts = useCallback(
    async ({ offset = 0, append = false }: { offset?: number; append?: boolean }) => {
      const query = new URLSearchParams();
      query.set("limit", String(PRODUCT_PAGE_SIZE));
      query.set("offset", String(offset));
      if (selectedCategoryId !== "__all__") query.set("categoryId", selectedCategoryId);
      if (debouncedSearchQuery.trim()) query.set("search", debouncedSearchQuery.trim());

      if (append) setIsLoadingMoreProducts(true);
      else setIsLoadingProducts(true);

      try {
        const response = await apiFetch<CatalogProductsPage>(`/catalog/products?${query.toString()}`);
        setProducts((current) => (append ? [...current, ...response.items] : response.items));
        setProductsTotal(response.total);
        setProductsOffset(response.offset + response.items.length);
        setHasMoreProducts(response.hasMore);
      } finally {
        setIsLoadingProducts(false);
        setIsLoadingMoreProducts(false);
      }
    },
    [debouncedSearchQuery, selectedCategoryId],
  );

  const loadMoreProducts = useCallback(() => {
    if (isComboView || isLoadingMoreProducts || !hasMoreProducts) return;
    void fetchProducts({ offset: productsOffset, append: true });
  }, [fetchProducts, hasMoreProducts, isComboView, isLoadingMoreProducts, productsOffset]);

  /* ── debounce search ── */
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  /* ── fetch on category / search change ── */
  useEffect(() => {
    if (isComboView) return;
    void fetchProducts({ offset: 0, append: false });
  }, [fetchProducts, isComboView]);

  /* ── live search dropdown ── */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let active = true;
    const run = async () => {
      const query = new URLSearchParams();
      query.set("search", searchQuery.trim());
      query.set("limit", String(SEARCH_RESULTS_LIMIT));
      query.set("offset", "0");
      try {
        const response = await apiFetch<CatalogProductsPage>(`/catalog/products?${query.toString()}`);
        if (active) setSearchResults(response.items);
      } catch {
        if (active) setSearchResults([]);
      }
    };
    const timeout = window.setTimeout(() => void run(), 180);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [searchQuery]);

  /* ── close dropdown on click outside ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ── derived data ── */
  const visibleProducts = useMemo(() => {
    if (sortBy === "name") return [...products].sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "price-asc") return [...products].sort((a, b) => Number(a.basePrice) - Number(b.basePrice));
    if (sortBy === "price-desc") return [...products].sort((a, b) => Number(b.basePrice) - Number(a.basePrice));
    return products;
  }, [products, sortBy]);

  const filteredPromos = useMemo(() => {
    if (!isComboView) return [];
    if (!searchQuery.trim()) return promotions;
    const q = searchQuery.toLowerCase();
    return promotions.filter((p) => p.name.toLowerCase().includes(q));
  }, [promotions, isComboView, searchQuery]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of initialCategories) map.set(c.id, c.name);
    return map;
  }, [initialCategories]);

  const totalProductCount = useMemo(
    () => initialCategories.reduce((sum, c) => sum + (c.productCount ?? 0), 0),
    [initialCategories],
  );

  const clearSearch = () => {
    setSearchQuery("");
    searchRef.current?.focus();
  };

  return {
    selectedCategoryId,
    setSelectedCategoryId,
    searchQuery,
    setSearchQuery,
    searchFocused,
    setSearchFocused,
    sortBy,
    setSortBy,
    isComboView,
    showDropdown,
    products,
    productsTotal,
    hasMoreProducts,
    isLoadingProducts,
    isLoadingMoreProducts,
    visibleProducts,
    loadMoreProducts,
    searchResults,
    clearSearch,
    searchRef,
    searchContainerRef,
    categories,
    totalProductCount,
    categoryMap,
    filteredPromos,
  };
}
