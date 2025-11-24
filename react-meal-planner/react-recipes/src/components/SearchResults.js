import React from 'react';
import {
    Box,
    List,
    ListItem,
    Paper,
    Typography,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

function SearchResults({ results, loading, onSelect }) {
    const navigate = useNavigate();

    if (!results?.length && !loading) return null;

    return (
        <Paper
            elevation={8}
            sx={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                right: 0,
                maxHeight: 400,
                overflow: 'auto',
                zIndex: 1000,
                backgroundColor: 'background.paper',
                borderRadius: 0,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
        >
            {loading ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={20} />
                </Box>
            ) : (
                <List sx={{ p: 0 }}>
                    {results.map((recipe) => (
                        <ListItem
                            key={recipe.id}
                            disablePadding
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: 'action.hover'
                                }
                            }}
                            onClick={() => {
                                onSelect();
                                navigate(`/recipe/${recipe.id}`);
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                p: 1.5,
                                gap: 2
                            }}>
                                <Box
                                    component="img"
                                    src={recipe.image}
                                    alt={recipe.title}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        objectFit: 'cover',
                                        backgroundColor: 'grey.100',
                                        flexShrink: 0
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontSize: '0.825rem',
                                        color: 'text.primary',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1,
                                        lineHeight: 1.4
                                    }}
                                >
                                    {recipe.title}
                                </Typography>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
}

export default SearchResults;