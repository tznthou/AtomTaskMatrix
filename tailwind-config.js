// ✅ Tailwind CSS 配置 - Memphis Design (粗邊框 + 彩色偏移陰影 + 旋轉)
// 大膽活力 × 有趣互動 = 充滿生命力的任務管理
// 參考: mockup-memphis.html

tailwind.config = {
    theme: {
        // ⚠️ 覆蓋 Tailwind 預設顏色，無需修改 HTML
        colors: {
            // 保持基本颜色
            white: '#FFFFFF',
            black: '#000000',
            transparent: 'transparent',

            // Hybrid 色彩映射 (Memphis 活力色彩)
            rose: {
                50: '#FFF5F8',
                100: '#FFE6ED',
                200: '#FFC8DC',
                300: '#FFAACB',
                400: '#FF6B9D',
                500: '#FF5A8D',
                600: '#FF6B9D',
                700: '#E64D8A',
                800: '#C64080',
                900: '#A53373'
            },
            emerald: {
                50: '#F5FFF8',
                100: '#E0FFF2',
                200: '#C1FFE5',
                300: '#A2FFD8',
                400: '#26DE81',
                500: '#1EBE6B',
                600: '#1A9E5A',
                700: '#157E4A',
                800: '#105E3A',
                900: '#0B3E2A'
            },
            amber: {
                50: '#FFFAF0',
                100: '#FFF1E0',
                200: '#FFE0C0',
                300: '#FFCFA0',
                400: '#FFA502',
                500: '#FF8F00',
                600: '#FF7F00',
                700: '#E67E00',
                800: '#CC6F00',
                900: '#B25D00'
            },
            sky: {
                50: '#F5FBFF',
                100: '#E6F7FF',
                200: '#CCF0FF',
                300: '#B3E8FF',
                400: '#00D2FC',
                500: '#00B8E6',
                600: '#009ECC',
                700: '#0084B3',
                800: '#006A99',
                900: '#005080'
            },
            // 灰色系（Neumorphism 背景）
            gray: {
                50: '#FAFAFA',
                100: '#F5F5F5',
                200: '#EEEEEE',
                300: '#E0E0E0',
                400: '#BDBDBD',
                500: '#9E9E9E',
                600: '#757575',
                700: '#616161',
                800: '#424242',
                900: '#212121'
            }
        },
        extend: {
            colors: {
                base: {
                    bg: '#F5F5F5',       // 背景
                    card: '#FFFFFF',     // 纯白卡片
                    border: '#2D2D2D',   // Memphis 粗黑邊框
                    text: '#2D2D2D',     // 深灰文字
                    subtle: '#757575'    // 中灰辅助文字
                },
                brand: {
                    primary: '#FF6B9D',  // Memphis 粉红 (主色) - 活力、友善
                    accent: '#FFA502',   // Memphis 橙色 (强调色) - 行动、热情
                    secondary: '#757575', // 灰色 (辅色) - 中立、稳定
                    success: '#26DE81',   // Memphis 绿 (成功)
                    warning: '#FFA502',   // Memphis 橙 (警告)
                    danger: '#FF6B6B'     // Memphis 红 (危险)
                },
                // 四象限專用色彩 (Memphis 飽和彩色方案)
                q: {
                    1: {
                        light: '#FFE6E6',   // Memphis 淡紅背景
                        main: '#FF6B6B',    // Memphis 紅 - 紧急重要
                        dark: '#C44569'     // Memphis 深紅
                    },
                    2: {
                        light: '#E6F9F0',   // Memphis 淡綠背景
                        main: '#26DE81',    // Memphis 綠 - 重要不紧急
                        dark: '#0FA060'     // Memphis 深綠
                    },
                    3: {
                        light: '#FFE6CC',   // Memphis 淡橙背景
                        main: '#FFA502',    // Memphis 橙 - 紧急不重要
                        dark: '#CC7700'     // Memphis 深橙
                    },
                    4: {
                        light: '#E6F2FF',   // Memphis 淡藍背景
                        main: '#00D2FC',    // Memphis 藍 - 不紧急不重要
                        dark: '#0099CC'     // Memphis 深藍
                    }
                }
            },
            boxShadow: {
                // Memphis 彩色偏移陰影
                'memphis-card': '8px 8px 0 rgba(255, 107, 157, 0.3), 12px 12px 0 rgba(255, 165, 2, 0.2)',
                'memphis-task': '6px 6px 0 rgba(255, 107, 157, 0.2)',
                'memphis-btn': '5px 5px 0 rgba(0, 0, 0, 0.2)',
                'memphis-ring': '0 0 0 3px #2D2D2D'
            },
            borderRadius: {
                'xl-lg': '1.25rem'
            },
            borderWidth: {
                '3': '3px',
                '4': '4px',
                '5': '5px'
            }
        }
    }
};
