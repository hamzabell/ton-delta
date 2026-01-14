export const TonLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="28" cy="28" r="28" fill="#0098EA"/>
    <path d="M37.56 15.6266L14.7265 24.3411C13.1666 24.9651 13.1766 25.8291 14.4402 26.215L20.3013 28.0263L33.8647 19.5398C34.5061 19.1558 35.0921 19.3662 34.6121 19.7894L23.6338 29.6358H23.6288L23.6338 29.6394L23.2307 35.5947C23.8211 35.5947 24.0818 35.3243 24.4128 35.0067L27.2474 32.2686L33.1415 36.5866C34.2274 37.1818 35.0076 36.875 35.2789 35.5867L39.1517 17.4334C39.549 15.8502 38.5496 15.1362 37.56 15.6266Z" fill="white"/>
  </svg>
);

export const TetherLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="16" fill="#009393"/>
    <path d="M19.9575 12.3965V10.4565H23.8475V6.75653H8.15753V10.4565H12.0475V12.3965C8.95753 12.6365 6.44751 13.4065 6.44751 14.3365C6.44751 15.2665 8.95753 16.0365 12.0475 16.2765V25.2165H19.9575V16.2765C23.0475 16.0365 25.5575 15.2665 25.5575 14.3365C25.5575 13.4065 23.0475 12.6365 19.9575 12.3965ZM16.0075 15.3565C13.6275 15.3565 11.6075 14.9365 11.0875 14.3365C11.6075 13.7365 13.6375 13.3165 16.0075 13.3165C18.3775 13.3165 20.3975 13.7365 20.9275 14.3365C20.3975 14.9365 18.3775 15.3565 16.0075 15.3565Z" fill="white"/>
  </svg>
);

export const StonFiLogo = ({ className }: { className?: string }) => (
   <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="50" cy="50" r="50" fill="black"/>
      <path d="M30 30L70 30L50 50L30 30Z" fill="#93F551"/> 
      <path d="M70 70L30 70L50 50L70 70Z" fill="#93F551" fillOpacity="0.6"/>
   </svg>
);

export const CcxtLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        {/* Simple "bracket" API logo style */}
        <rect width="40" height="40" rx="8" fill="#1e293b"/>
        <path d="M12 28L8 20L12 12" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28 12L32 20L28 28" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18 20H22" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round"/>
    </svg>
);
