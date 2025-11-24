import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#FF9F29', // Warm orange from the design
            light: '#FFB156',
            dark: '#E88C1A',
        },
        secondary: {
            main: '#1B1B1B',
            light: '#2C2C2C',
            dark: '#000000',
        },
        background: {
            default: '#FFFFFF',
            paper: '#F8F8F8',
        },
    },
    typography: {
        fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
        h1: {
            fontSize: '1.75rem',
            fontWeight: 600,
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 600,
        },
        h3: {
            fontSize: '1.25rem',
            fontWeight: 600,
        },
        h4: {
            fontSize: '1.1rem',
            fontWeight: 500,
        },
        h5: {
            fontSize: '1rem',
            fontWeight: 500,
        },
        h6: {
            fontSize: '0.875rem',
            fontWeight: 500,
        },
        subtitle1: {
            fontSize: '0.875rem',
            fontWeight: 400,
        },
        body1: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.8rem',
            lineHeight: 1.5,
        }
    },
    shape: {
        borderRadius: 16,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 20,
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                },
                contained: {
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: 'none',
                    },
                },
                text: {
                    '&:hover': {
                        backgroundColor: 'rgba(255, 159, 41, 0.04)',
                    },
                },
                outlined: {
                    borderRadius: 20,
                    '&:hover': {
                        backgroundColor: 'rgba(255, 159, 41, 0.04)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
                    borderRadius: 16,
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    fontSize: '0.75rem',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 12,
                        fontSize: '0.875rem',
                    },
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    fontSize: '0.8rem',
                },
            },
        },
    },
});

export default theme;