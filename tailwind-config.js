// ✅ Tailwind CSS 配置 - 從內聯腳本提取到外部檔案
// 這樣可以符合 CSP (Content Security Policy) 安全政策

tailwind.config = {
    theme: {
        extend: {
            colors: {
                base: {
                    bg: '#F4F6FB',
                    card: '#FFFFFF',
                    border: '#E2E8F0',
                    text: '#1E293B',
                    subtle: '#64748B'
                },
                brand: {
                    primary: '#2563EB',
                    accent: '#0EA5E9',
                    success: '#22C55E',
                    warning: '#F59E0B',
                    danger: '#EF4444'
                }
            },
            boxShadow: {
                card: '0 12px 32px -20px rgba(15, 23, 42, 0.18)',
                elevation: '0 18px 40px -24px rgba(15, 23, 42, 0.18)'
            },
            borderRadius: {
                'xl-lg': '1.25rem'
            }
        }
    }
};
