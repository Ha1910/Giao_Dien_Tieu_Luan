import { useState, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';

const useFuzzySearch = (data, searchQuery, options = {}) => {
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Default Fuse.js options
  const defaultOptions = {
    keys: ['name', 'description', 'category_name'],
    threshold: 0.4, // 0 = exact match, 1 = match anything
    distance: 100,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,
    shouldSort: true,
    ...options
  };

  // Create Fuse instance
  const fuse = useMemo(() => {
    if (!data || data.length === 0) return null;
    return new Fuse(data, defaultOptions);
  }, [data, JSON.stringify(defaultOptions)]);

  // Perform search
  useEffect(() => {
    if (!fuse || !searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const searchResults = fuse.search(searchQuery);
      
      // Transform results to include original item and search metadata
      const transformedResults = searchResults.map(result => ({
        ...result.item,
        _fuzzyScore: result.score,
        _fuzzyMatches: result.matches || []
      }));

      setResults(transformedResults);
    } catch (error) {
      console.error('Fuzzy search error:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [fuse, searchQuery]);

  // Get highlighted text function
  const getHighlightedText = (text, matches = []) => {
    if (!matches || matches.length === 0) return text;

    let highlightedText = text;
    const ranges = [];

    // Collect all match ranges
    matches.forEach(match => {
      if (match.indices) {
        match.indices.forEach(([start, end]) => {
          ranges.push({ start, end: end + 1 });
        });
      }
    });

    // Sort ranges by start position (descending to avoid index shifting)
    ranges.sort((a, b) => b.start - a.start);

    // Apply highlights
    ranges.forEach(({ start, end }) => {
      const before = highlightedText.slice(0, start);
      const highlighted = highlightedText.slice(start, end);
      const after = highlightedText.slice(end);
      
      highlightedText = `${before}<mark class="bg-yellow-200 px-1 rounded">${highlighted}</mark>${after}`;
    });

    return highlightedText;
  };

  return {
    results,
    isSearching,
    getHighlightedText,
    totalResults: results.length
  };
};

export default useFuzzySearch;
