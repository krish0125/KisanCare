document.addEventListener('DOMContentLoaded', () => {
    const defaultLang = 'en';
    const currentLang = localStorage.getItem('kisanLang') || defaultLang;
    
    // Set initial value in dropdowns
    document.querySelectorAll('#langSwitcher').forEach(el => {
        el.value = currentLang;
        
        el.addEventListener('change', (e) => {
            const newLang = e.target.value;
            setLanguage(newLang);
        });
    });

    // Initial load
    setLanguage(currentLang);
});

async function setLanguage(lang) {
    try {
        const response = await fetch(`i18n/${lang}.json`);
        if (!response.ok) throw new Error(`Could not load translations for ${lang}`);
        const translations = await response.json();
        
        // Save choice
        localStorage.setItem('kisanLang', lang);
        
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) {
                // If it contains a material icon, we want to preserve the icon and just replace the text
                const icon = el.querySelector('.material-icons');
                if (icon) {
                    el.innerHTML = '';
                    el.appendChild(icon);
                    el.appendChild(document.createTextNode(' ' + translations[key]));
                } else {
                    el.textContent = translations[key];
                }
            }
        });
        
        // Update dropdowns to match
        document.querySelectorAll('#langSwitcher').forEach(el => {
            el.value = lang;
        });
        
    } catch (err) {
        console.error('Error switching language:', err);
    }
}
