import React, { useEffect, useState, useRef } from 'react';
import { TextField, InputAdornment, CircularProgress, Box, ClickAwayListener } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SearchResults from './SearchResults';

function SearchBar({ searchTerm, setSearchTerm, handleSearch, loading, compact = false }) {
    const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
    const [showResults, setShowResults] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const searchTimeoutRef = useRef(null);
    const handleSearchRef = useRef(handleSearch);

    // Keep a stable ref to the latest handleSearch to avoid effect loops
    useEffect(() => {
        handleSearchRef.current = handleSearch;
    }, [handleSearch]);

    // Update debounced value after 500ms of no changes
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!searchTerm.trim()) {
            setSearchResults([]);
            setShowResults(false);
            return;
        }

        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    // Trigger search when debounced value changes (avoid depending on handleSearch identity)
    useEffect(() => {
        let canceled = false;
        if (debouncedTerm?.trim()) {
            const fetchResults = async () => {
                try {
                    const results = await handleSearchRef.current(true);
                    if (!canceled && results?.results) {
                        setSearchResults(results.results);
                        setShowResults(true);
                    }
                } catch (e) {
                    // ignore errors for autocomplete dropdown
                }
            };
            fetchResults();
        }
        return () => { canceled = true };
    }, [debouncedTerm]);

    const handleClickAway = () => {
        setShowResults(false);
    };

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <Box sx={{ position: 'relative', width: compact ? 200 : '100%' }}>
                <TextField
                    placeholder="Search recipes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    size={compact ? "small" : "medium"}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="primary" sx={{ fontSize: compact ? '1.2rem' : '1.5rem' }} />
                            </InputAdornment>
                        ),
                        endAdornment: loading && (
                            <InputAdornment position="end">
                                <CircularProgress size={16} color="primary" />
                            </InputAdornment>
                        ),
                        sx: {
                            py: compact ? 0.2 : 0.8,
                            px: 2,
                            backgroundColor: 'background.paper',
                            borderRadius: 2,
                            minWidth: compact ? 200 : 300,
                            '&:hover': {
                                backgroundColor: 'background.paper'
                            }
                        }
                    }}
                    variant="standard"
                    sx={{
                        width: '100%',
                        '& .MuiInput-underline:before': { borderBottom: 'none' },
                        '& .MuiInput-underline:after': { borderBottom: 'none' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottom: 'none' }
                    }}
                />
                {showResults && (
                    <SearchResults
                        results={searchResults}
                        loading={loading}
                        onSelect={() => {
                            setShowResults(false);
                            setSearchTerm('');
                        }}
                    />
                )}
            </Box>
        </ClickAwayListener>
    );
}

export default SearchBar;