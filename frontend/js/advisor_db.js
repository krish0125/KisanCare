let liveWeather = null;

function fetchLiveWeather() {
    let city = document.getElementById('advisorCity').value;
    if (!city) {
        alert("Enter a city first!");
        return;
    }
    // Mock weather fetch
    liveWeather = { temp: 28, humidity: 65, rain1h: 0 };
    document.getElementById('weatherStatus').innerHTML = `️ Weather fetched for ${city}: 28°C, 65% Humidity, No Rain expected.`;
    document.getElementById('weatherStatus').style.color = '#2ecc71';
}

function showToast(msg) {
    alert(msg);
}

const cropSoilDB = {
    wheat: {
        name: 'Wheat',
        soilNeeds: { alluvial: 'Ideal', black: 'Good', red: 'Medium', sandy: 'Low', loamy: 'Ideal', laterite: 'Low' },
        basalFert: [
            { name: 'DAP (18-46-0)', icon: '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>', why: 'Essential for strong root establishment.', dose: '50 kg/acre', price: 1350 },
            { name: 'MOP (0-0-60)', icon: '', why: 'Increases grain size and disease resistance.', dose: '20 kg/acre', price: 950 }
        ],
        topDressFert: [
            { name: 'Urea (46-0-0)', icon: '', why: 'Boosts vegetative growth and tillering.', dose: '45 kg/acre', price: 266 }
        ],
        simple: 'Gehu ke liye shuru mein root growth zaroori hai. DAP buwai pe dein, Urea pehle paani ke baad.',
        dos: ['Apply first irrigation after 21 days (CRI stage)', 'Use Neem Coated Urea'],
        donts: ['Do not apply Urea on dry soil', 'Avoid over-irrigation as it causes yellowing']
    },
    paddy: {
        name: 'Paddy / Rice',
        soilNeeds: { alluvial: 'Good', black: 'Ideal', red: 'Medium', sandy: 'Low', loamy: 'Ideal', laterite: 'Low' },
        basalFert: [
            { name: 'DAP (18-46-0)', icon: '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>grass</span>', why: 'For deep roots that withstand flooded conditions.', dose: '40 kg/acre', price: 1350 },
            { name: 'MOP (0-0-60)', icon: '', why: 'For stem strength to prevent lodging.', dose: '25 kg/acre', price: 950 }
        ],
        topDressFert: [
            { name: 'Urea (46-0-0)', icon: '', why: 'For maximum tillers and greener leaves.', dose: '30 kg/acre in 2 splits', price: 266 },
            { name: 'Zinc Sulphate', icon: '', why: 'Crucial for rice. Prevents Khaira disease.', dose: '10 kg/acre', price: 450 }
        ],
        simple: 'Dhaan ko pani ki zyada zaroorat hoti hai. Khad pani khada hone par ya kachhi mitti mein dein.',
        dos: ['Maintain 2-3 cm water level for initial 15 days', 'Add Zinc to prevent Khaira disease'],
        donts: ['Do not apply Urea directly into deep standing water (>5cm)']
    },
    cotton: {
        name: 'Cotton',
        soilNeeds: { alluvial: 'Good', black: 'Ideal', red: 'Medium', sandy: 'Low', loamy: 'Ideal', laterite: 'Low' },
        basalFert: [
            { name: 'NPK 10-26-26', icon: '<span class=\x22material-icons\x22 style=\x22vertical-align: middle; font-size: inherit;\x22>cloud</span>', why: 'Balanced nutrition for longer tap roots.', dose: '50 kg/acre', price: 1470 }
        ],
        topDressFert: [
            { name: 'Urea (46-0-0)', icon: '', why: 'For robust plant canopy.', dose: '25 kg/acre', price: 266 },
            { name: 'Liquid Boron Spray', icon: '', why: 'Prevents boll shedding, increases retention.', dose: '2 ml/litre spray', price: 180 }
        ],
        simple: 'Kapas mein excessive nitrogen se avoid karein warna kide zyada lagte hain. Boron zaroori hai.',
        dos: ['Spray Boron at flowering to stop boll fall', 'Weed control is essential before top dressing'],
        donts: ['Avoid heavy watering; cotton dislikes waterlogging']
    },
    sugarcane: {
        name: 'Sugarcane',
        soilNeeds: { alluvial: 'Ideal', black: 'Good', red: 'Medium', sandy: 'Low', loamy: 'Ideal', laterite: 'Low' },
        basalFert: [
            { name: 'NPK 12-32-16', icon: '', why: 'Complete nutrition for strong germination.', dose: '75 kg/acre', price: 1470 }
        ],
        topDressFert: [
            { name: 'Urea (46-0-0)', icon: '', why: 'High demand for vegetative growth.', dose: '60 kg/acre', price: 266 }
        ],
        simple: 'Ganne mein khad ki zaroorat zyada hoti hai kyonki yeh saal bhar ki fasal hai.',
        dos: ['Earthing up (mitti chadhana) after top dressing', 'Split nitrogen in 3 doses for high efficiency'],
        donts: ['Don\'t delay fertilizer beyond 4 months of crop age']
    },
    tomato: {
        name: 'Tomato',
        soilNeeds: { alluvial: 'Good', black: 'Medium', red: 'Good', sandy: 'Medium', loamy: 'Ideal', laterite: 'Low' },
        basalFert: [
            { name: 'NPK 10-26-26', icon: '', why: 'High P and K for flowering and fruit quality.', dose: '50 kg/acre', price: 1470 }
        ],
        topDressFert: [
            { name: 'Urea (46-0-0)', icon: '', why: 'Vegetative growth before flowering.', dose: '20 kg/acre', price: 266 },
            { name: 'Liquid NPK 5-15-45', icon: '', why: 'Enhances fruit size and color.', dose: 'Spray at fruiting', price: 225 }
        ],
        simple: 'Tamatar mein potassium aur calcium zaruri hai achhe size aur shine ke liye.',
        dos: ['Use drip fertigation for maximum yield', 'Apply Calcium to avoid Blossom End Rot'],
        donts: ['Avoid too much Urea during flowering']
    },
    potato: {
        name: 'Potato',
        soilNeeds: { alluvial: 'Ideal', black: 'Medium', red: 'Good', sandy: 'Good', loamy: 'Ideal', laterite: 'Low' },
        basalFert: [
            { name: 'DAP (18-46-0)', icon: '', why: 'For rapid early tuber initiation.', dose: '60 kg/acre', price: 1350 },
            { name: 'MOP (0-0-60)', icon: '', why: 'Essential for starch formation in tubers.', dose: '40 kg/acre', price: 950 }
        ],
        topDressFert: [
            { name: 'Urea (46-0-0)', icon: '', why: 'For canopy development.', dose: '30 kg/acre', price: 266 }
        ],
        simple: 'Aloo ko bur-buri mitti aur P+K ki bahut zaroorat hoti hai chamakdar aloo ke liye.',
        dos: ['Apply full DAP+MOP dose at sowing', 'Do earthing up within 25 days'],
        donts: ['Do not apply MOP as top-dressing later']
    }
};

// Simple Cart Logic for the Fertilizer Store
let cartItems = [];

function addToCart(itemName, price) {
    cartItems.push({ name: itemName, price: price });
    document.getElementById('cartCount').innerText = cartItems.length;
    showToast(itemName + " added to your cart!");
}

function viewCart() {
    if (cartItems.length === 0) {
        alert("Your cart is empty.");
        return;
    }
    let total = 0;
    let msg = "Your Cart:\n\n";
    for(let item of cartItems) {
        msg += "• " + item.name + " - ₹" + item.price + "\n";
        total += item.price;
    }
    msg += "\nTotal: ₹" + total + "\n\nProceed to checkout?";
    let buy = confirm(msg);
    if(buy) {
        alert("Thank you for your purchase!");
        cartItems = [];
        document.getElementById('cartCount').innerText = "0";
    }
}
