// ✅ Tailwind CSS 配置 - Hybrid Design (Memphis 色彩 + Neumorphism 質感)
// 活力色彩 + 柔和陰影 = 舒適但充滿活力
// 参考: ux-ux-genis.md - Performance-Optimized Design System (Balanced Mode)

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
                    bg: '#F5F5F5',       // Neumorphism 背景
                    card: '#FFFFFF',     // 纯白卡片
                    border: '#EEEEEE',   // 浅灰边框
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
                // 四象限專用色彩 (Memphis 彩色方案)
                q: {
                    1: {
                        light: '#FFF5F8',   // 淺粉背景
                        main: '#FF6B9D',    // 粉紅 - 紧急重要
                        dark: '#E64D8A'     // 深粉紅
                    },
                    2: {
                        light: '#F5FFF8',   // 淺綠背景
                        main: '#26DE81',    // 綠 - 重要不紧急
                        dark: '#1A9E5A'     // 深綠
                    },
                    3: {
                        light: '#FFFAF0',   // 淺橙背景
                        main: '#FFA502',    // 橙 - 紧急不重要
                        dark: '#E67E00'     // 深橙
                    },
                    4: {
                        light: '#F5FBFF',   // 淺藍背景
                        main: '#00D2FC',    // 藍 - 不紧急不重要
                        dark: '#0084B3'     // 深藍
                    }
                }
            },
            boxShadow: {
                // Neumorphism 柔和陰影
                card: '8px 8px 16px rgba(0, 0, 0, 0.12), -8px -8px 16px rgba(255, 255, 255, 0.8)',
                elevation: '6px 6px 12px rgba(0, 0, 0, 0.12), -6px -6px 12px rgba(255, 255, 255, 0.8)'
            },
            borderRadius: {
                'xl-lg': '1.25rem'
            }
        }
    }
};
