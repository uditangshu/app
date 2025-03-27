import { ColorValue } from 'react-native';

interface ThemeColors {
  primary: {
    dark: string;
    main: string;
    light: string;
  };
  secondary: {
    main: string;
    light: string;
    dark: string;
  };
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  background: {
    default: string;
    paper: string;
    overlay: string;
  };
  border: {
    main: string;
    light: string;
  };
  error: string;
  warning: string;
  success: string;
  surface: string;
  info: string;
}

interface ThemeFonts {
  regular: {
    fontFamily: string;
    fontWeight: '400';
  };
  medium: {
    fontFamily: string;
    fontWeight: '500';
  };
  bold: {
    fontFamily: string;
    fontWeight: '700';
  };
}

interface Theme {
  COLORS: ThemeColors;
  FONTS: ThemeFonts;
  SPACING: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  BORDER_RADIUS: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  SIZES: {
    heading1: number;
    heading2: number;
    heading3: number;
    body1: number;
    body2: number;
    caption: number;
  };
  SHADOWS: {
    small: {
      shadowColor: string;
      shadowOffset: {
        width: number;
        height: number;
      };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowColor: string;
      shadowOffset: {
        width: number;
        height: number;
      };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowColor: string;
      shadowOffset: {
        width: number;
        height: number;
      };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
}

export const theme: Theme = {
  COLORS: {
    primary: {
      main: '#86BC25', // Deloitte Green
      light: '#A3D14D',
      dark: '#6B9B1E',
    },
    secondary: {
      main: '#2C5282', // Deloitte Blue
      light: '#4299E1',
      dark: '#2B6CB0',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
      disabled: '#666666',
    },
    background: {
      default: '#1A1A1A',
      paper: '#2D2D2D',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    border: {
      main: '#404040',
      light: '#666666',
    },
    error: '#FF4B4B',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
    surface: '#2A2A2A',
  },
  FONTS: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  BORDER_RADIUS: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
  },
  SIZES: {
    heading1: 32,
    heading2: 24,
    heading3: 20,
    body1: 16,
    body2: 14,
    caption: 12,
  },
  SHADOWS: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 6,
    },
  },
};

export const lightTheme = {
  COLORS: {
    primary: {
      main: '#1C8D3A',
      light: '#4DA3FF',
      dark: '#165C27',
    },
    background: {
      main: '#FFFFFF',
      paper: '#F5F5F5',
      elevated: '#FFFFFF',
      default: '#FFFFFF',
    },
    text: {
      primary: '#000000',
      secondary: '#666666',
    },
    border: '#E0E0E0',
    error: '#FF3B30',
  },
  FONTS: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    semibold: {
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
  },
};

export const darkTheme = {
  COLORS: {
    primary: {
      main: '#1C8D3A',
      light: '#4DA3FF',
      dark: '#165C27',
    },
    background: {
      main: '#000000',
      paper: '#1C1C1E',
      elevated: '#2C2C2E',
      default: '#000000',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93',
    },
    border: '#38383A',
    error: '#FF453A',
  },
  FONTS: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    semibold: {
      fontFamily: 'System',
      fontWeight: '600' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
  },
};

export default theme; 