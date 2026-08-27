const VERSION = 9;
const CURRENCIES = ['AED', 'MVR', 'INR', 'USD'];
const EXPENSE_CATEGORIES = [
  ['Housing', '🏠'], ['Food', '🍲'], ['Transport', '🚕'], ['Bills', '💡'],
  ['Health', '❤️'], ['Debt', '🧾'], ['Savings', '🌱'], ['Shopping', '🛍️'],
  ['Entertainment', '🎬'], ['Travel', '✈️'], ['Other', '•••']
];
const INCOME_CATEGORIES = ['Salary', 'Bonus', 'Side income', 'Gift', 'Refund', 'Other income'];
const INCOME_CATEGORY_ICONS = { Salary: '💼', Bonus: '✨', 'Side income': '🛠️', Gift: '🎁', Refund: '↩️', 'Other income': '＋' };
const QUICK_NOTE_SUGGESTIONS = {
  Housing: 'Rent or home cost', Food: 'Groceries or meal', Transport: 'Taxi, bus or fuel', Bills: 'Monthly bill',
  Health: 'Medicine or care', Debt: 'Debt payment', Savings: 'Money set aside', Shopping: 'Household shopping',
  Entertainment: 'Movie or outing', Travel: 'Trip expense', Other: 'Other expense',
  Salary: 'Monthly salary', Bonus: 'Work bonus', 'Side income': 'Extra income', Gift: 'Gift received',
  Refund: 'Refund received', 'Other income': 'Other income'
};
const ESSENTIAL_CATEGORIES = ['Housing', 'Food', 'Transport', 'Bills', 'Health'];
const WANT_CATEGORIES = ['Shopping', 'Entertainment', 'Travel', 'Other'];
const METALS = [['XAU', 'Gold'], ['XAG', 'Silver'], ['XPT', 'Platinum'], ['XPD', 'Palladium']];
const CRYPTO = [['BTC', 'Bitcoin'], ['ETH', 'Ethereum'], ['LTC', 'Litecoin'], ['XRP', 'XRP'], ['DOT', 'Polkadot'], ['ADA', 'Cardano']];
const DEFAULT = {
  version: VERSION,
  settings: {
    base: 'MVR', lastCurrency: 'MVR', rates: { USD: 1, AED: 3.6725, MVR: 15.42, INR: 88 },
    paydayDay: null, funMode: true, debtStrategy: 'avalanche', lastExpenseCategory: 'Food', lastExpenseAccountId: '', lastIncomeAccountId: ''
  },
  member: { displayName: '', role: '' }, people: [],
  transactions: [],
  budgets: {
    Housing: { amount: 11500, currency: 'MVR' }, Food: { amount: 3000, currency: 'MVR' },
    Bills: { amount: 1500, currency: 'MVR' }, Transport: { amount: 1000, currency: 'MVR' },
    Shopping: { amount: 2000, currency: 'MVR' }, Other: { amount: 2000, currency: 'MVR' }
  },
  goals: [], debts: [], assets: [], accounts: [], recurring: [], contributions: [], snapshots: [], checkups: [],
  sinkingFunds: [], weeklyReviews: [], prices: {}
};

const SAKHI_HELP = {
  'sign-in': { en: 'Sign in', mr: 'अ‍ॅपमध्ये प्रवेश', body: 'हे फक्त धनी आणि सखी यांच्या खाजगी घरगुती खात्यासाठीचे लॉगिन आहे. योग्य ईमेल आणि पासवर्ड टाकल्यावर दोघांनाही एकच अद्ययावत माहिती दिसते.', action: 'तुमच्यासाठी तयार केलेला ईमेल आणि पासवर्ड वापरा. पासवर्ड कोणासोबत शेअर करू नका.' },
  'auth-email': { en: 'Email', mr: 'ईमेल', body: 'तुमच्या Our DHAN खात्याशी जोडलेला ईमेल येथे टाका.', action: 'पूर्ण ईमेल पत्ता टाका. स्पेलिंग किंवा शेवटी मोकळी जागा राहू देऊ नका.' },
  'auth-password': { en: 'Password', mr: 'पासवर्ड', body: 'हा तुमच्या खाजगी आर्थिक माहितीचा प्रवेश संकेत आहे.', action: 'तुमचा ठरलेला पासवर्ड टाका.', tip: 'पासवर्ड फोनच्या नोट्समध्ये उघडपणे ठेवू नका.' },

  'today-page': { en: 'Today', mr: 'आजचे पान', body: 'रोज वापरण्यासाठी हे मुख्य पान आहे. आज किती सुरक्षित खर्च करता येईल, या महिन्याची स्थिती, नियमित बिले आणि अलीकडील नोंदी येथे दिसतात.', action: 'पैसे आले किंवा गेले की लगेच नोंद करा आणि नियमित नोंदी Confirm करा.' },
  'safe-spend': { en: 'Safe to spend today', mr: 'आजची सुरक्षित खर्च मर्यादा', body: 'खात्यातील उपलब्ध पैसे, ध्येयांसाठी राखीव रक्कम, येणारी बिले, कर्जाचे किमान हप्ते आणि तीन दिवसांचा गरजेचा साठा लक्षात घेऊन ही रक्कम ठरते.', action: 'फक्त गरज नसलेल्या किंवा मजेच्या खर्चासाठी ही मर्यादा वापरा.', tip: 'ही तुमची पूर्ण बँक शिल्लक नाही. मर्यादा शून्य असेल तर ऐच्छिक खर्च थांबवा.' },
  'safe-week': { en: 'This week', mr: 'या आठवड्याची सुरक्षित मर्यादा', body: 'पुढील पगारापर्यंतच्या सुरक्षित दैनिक मर्यादेवरून सात दिवसांसाठी अंदाज दिला जातो.', action: 'आठवड्याचा बाहेर खाणे, खरेदी किंवा मनोरंजन खर्च याच्या आत ठेवा.' },
  'next-payday': { en: 'Next payday', mr: 'पुढचा पगाराचा दिवस', body: 'Settings मध्ये दिलेल्या पगाराच्या तारखेवरून पुढचा पगार कधी येईल ते दाखवते.', action: 'पगाराची तारीख बदलल्यास Settings मध्ये लगेच दुरुस्त करा.' },
  'protected-first': { en: 'Protected first', mr: 'आधी बाजूला ठेवायची रक्कम', body: 'पगार येण्यापूर्वी भरायची बिले, कर्जाचे किमान हप्ते आणि नियोजित निधी यांची एकूण रक्कम.', action: 'ही रक्कम सामान्य खर्चासाठी वापरू नका.' },
  'safety-buffer': { en: 'Safety buffer', mr: 'सुरक्षित राखीव रक्कम', body: 'तीन दिवसांच्या अत्यावश्यक खर्चासाठी ठेवलेली छोटी आपत्कालीन मर्यादा.', action: 'फक्त खरोखर आवश्यक खर्चासाठीच वापरा.' },
  'add-spend': { en: 'Add spend', mr: 'खर्च नोंदवा', body: 'खात्यातून किंवा रोखीतून पैसे गेले की ही नोंद करा. तारीख, रक्कम, चलन, कोणत्या खात्यातून पैसे गेले, कारण आणि कोणी पैसे दिले हे निवडा.', action: 'खर्च झाल्यानंतर लगेच नोंद करा म्हणजे खाते शिल्लक बरोबर राहील.', tip: 'एका खात्यातून दुसऱ्या खात्यात पैसे हलवले असतील तर Add spend न वापरता Transfer वापरा.' },
  'add-income': { en: 'Add income', mr: 'उत्पन्न नोंदवा', body: 'पगार, बोनस, अतिरिक्त कमाई, भेट किंवा परतावा प्रत्यक्ष खात्यात जमा झाला की ही नोंद करा.', action: 'पैसे ज्या खात्यात आले तेच खाते निवडा.', tip: 'खाते शिल्लक दुरुस्त करण्यासाठी खोटे उत्पन्न टाकू नका.' },
  'transfer': { en: 'Transfer', mr: 'खात्यांमधील पैसे हलवा', body: 'एका स्वतःच्या खात्यातून दुसऱ्या खात्यात पैसे पाठवण्यासाठी Transfer वापरा. यामुळे एक खाते कमी आणि दुसरे वाढते; उत्पन्न, खर्च किंवा निव्वळ संपत्ती बदलत नाही.', action: 'From account, To account आणि दोन्ही खात्यांत प्रत्यक्ष गेलेली/आलेली रक्कम निवडा.', tip: 'चलने वेगवेगळी असल्यास पाठवलेली आणि मिळालेली रक्कम वेगळी असू शकते.' },
  'phone-shortcut': { en: 'Phone shortcut', mr: 'फोनवरून पटकन खर्च नोंदवा', body: 'iPhone Back Tap किंवा Android home-screen shortcut वापरून Add spend थेट उघडता येते.', action: 'Settings मधील Fast expense shortcut उघडून तुमच्या फोनसाठी दिलेल्या पायऱ्या पूर्ण करा.' },
  'money-available': { en: 'Money available', mr: 'सध्या उपलब्ध एकूण पैसे', body: 'सर्व सक्रिय बँक, रोख आणि मोबाइल वॉलेट खात्यांची सध्याची एकूण शिल्लक.', action: 'प्रत्येक खाते नियमितपणे वास्तविक शिल्लकीशी जुळवा.' },
  'reserved-goals': { en: 'Reserved for goals', mr: 'ध्येयांसाठी राखीव पैसे', body: 'Goals आणि नियोजित निधीसाठी आधीच बाजूला ठेवलेली रक्कम. हे पैसे खात्यातच असू शकतात पण सामान्य खर्चासाठी उपलब्ध नाहीत.', action: 'ध्येयासाठी ठेवलेले पैसे खर्च करू नका.' },
  'month-left': { en: 'This month left', mr: 'या महिन्याचे उत्पन्न वजा खर्च', body: 'या कॅलेंडर महिन्यात नोंदलेले उत्पन्न वजा नोंदलेला खर्च.', action: 'हा आकडा खाते शिल्लक नसून महिन्याचा परिणाम आहे.' },
  'monthly-checklist': { en: 'Monthly checklist', mr: 'दर महिन्याची नियमित नोंद', body: 'पगार, भाडे, इंटरनेट किंवा इतर नियमित रक्कम एकदा तयार करा आणि ती प्रत्यक्ष आली किंवा गेली की Confirm करा.', action: 'रक्कम प्रत्यक्ष हलल्याशिवाय Confirm करू नका.' },
  'recent-activity': { en: 'Recent activity', mr: 'अलीकडील व्यवहार', body: 'धनी आणि सखी यांनी नोंदवलेले नवीन खर्च, उत्पन्न आणि transfers येथे दिसतात.', action: 'चुकीची नोंद दिसल्यास ती उघडून दुरुस्त करा.' },

  'money-page': { en: 'Money', mr: 'संपूर्ण आर्थिक चित्र', body: 'सर्व खाती, इतर मालमत्ता, कर्ज आणि निव्वळ संपत्ती एका ठिकाणी दाखवणारे पान.', action: 'आठवड्यातून एकदा खाते शिल्लक तपासा आणि बाजारभाव Refresh करा.' },
  'net-worth': { en: 'Household net worth', mr: 'घराची निव्वळ संपत्ती', body: 'सर्व खात्यांतील पैसे + इतर मालमत्तेची किंमत − उरलेले कर्ज = निव्वळ संपत्ती.', action: 'खाती, मालमत्ता आणि कर्जाची शिल्लक खरी ठेवली तरच हा आकडा उपयोगी आहे.', tip: 'ध्येयासाठी राखीव पैसे आधीच खात्यांत आहेत; ते पुन्हा मालमत्ता म्हणून जोडू नका.' },
  'live-rates': { en: 'Refresh rates', mr: 'ताजे बाजारभाव आणा', body: 'सोने, चांदी आणि crypto चे मोफत live भाव आणून मालमत्ता आणि निव्वळ संपत्ती पुन्हा मोजते.', action: 'Money पान पाहताना Refresh rates वर टॅप करा.', tip: 'हे AED, MVR किंवा INR चे विनिमय दर बदलत नाही. ते Settings मध्ये हाताने तपासायचे आहेत.' },
  'accounts': { en: 'Accounts', mr: 'बँक, रोख आणि वॉलेट खाती', body: 'Starting balance पासून त्या खात्याशी जोडलेले प्रत्येक उत्पन्न, खर्च आणि transfer धरून सध्याची शिल्लक मोजली जाते.', action: 'Statement मध्ये रोजची हालचाल पहा. वास्तविक शिल्लक वेगळी असेल तर Correct balance वापरा.' },
  'spendable-goals': { en: 'Spendable after goals', mr: 'ध्येयांची रक्कम वगळून उपलब्ध पैसे', body: 'सर्व खात्यांची शिल्लक वजा Goals आणि नियोजित निधीसाठी राखीव रक्कम.', action: 'सामान्य खर्चासाठी यापेक्षा जास्त पैसे उपलब्ध आहेत असे समजू नका.' },
  'assets': { en: 'Other assets', mr: 'इतर मालमत्ता', body: 'सोने, चांदी, crypto, गुंतवणूक, मालमत्ता किंवा इतर मूल्यवान गोष्टी येथे नोंदवा. Metals आणि crypto बाजारभावाने; इतर गोष्टी हाताने दिलेल्या किंमतीने मोजल्या जातात.', action: 'खरेदी किंवा विक्रीनंतर quantity किंवा current value दुरुस्त करा.', tip: 'मालमत्ता खरेदी करताना खात्यातून गेलेले पैसेही नोंदवा; नाहीतर निव्वळ संपत्ती चुकीची वाढेल.' },
  'wealth-journey': { en: 'Wealth journey', mr: 'संपत्तीची वाटचाल', body: 'Actual मध्ये जतन केलेली खरी निव्वळ संपत्ती दिसते. 12-month plan मध्ये सध्याचे उत्पन्न, खर्च, कर्ज आणि 40–30–20–10 पद्धतीवर आधारित अंदाज दिसतो.', action: 'अंदाजाला हमी समजू नका; दर महिन्याला खरी प्रगती तपासा.' },
  'best-next-moves': { en: 'Best next moves', mr: 'पुढे काय करावे', body: 'तुमच्या नोंदवलेल्या आकड्यांवरून अ‍ॅप सर्वात उपयोगी पुढची पावले सुचवते.', action: 'एकावेळी एक सोपी कृती निवडा.', tip: 'ही सामान्य दिशा आहे; बँक किंवा गुंतवणूक सल्ला नाही.' },

  'plan-page': { en: 'Plan', mr: 'पैशांचा आराखडा', body: '40–30–20–10 वाटप, पगाराचा वापर, कर्ज, Goals, नियोजित निधी, category budget आणि नियमित व्यवहार येथे सांभाळा.', action: 'पगाराच्या दिवशी हे पान उघडून प्रत्येक रुपयाला काम द्या.' },
  'allocation': { en: '40–30–20–10', mr: 'उत्पन्नाची 40–30–20–10 विभागणी', body: '40% गरजेचे खर्च, 30% कर्जमुक्ती, 20% भविष्य/बचत आणि 10% इच्छा व मजा. अ‍ॅप नोंदवलेल्या उत्पन्नावरून प्रत्येक मर्यादा मोजते.', action: 'ही खर्च करण्याची सक्ती नाही. न वापरलेले पैसे बचत किंवा कर्जाकडे वळवा.', tip: 'कर्ज संपल्यावर 30% Future मध्ये वळवता येते.' },
  'payday-assistant': { en: 'Payday assistant', mr: 'पगार आल्यावर काय करावे', body: 'या महिन्याच्या पगाराला 40–30–20–10 प्रमाणे चार कामांत विभागून अचूक लक्ष्य रक्कम दाखवते.', action: 'अ‍ॅप आपोआप पैसे हलवत नाही. प्रत्यक्ष payment किंवा saving केल्यानंतरच नोंद करा.' },
  'emergency-fund': { en: 'Emergency fund', mr: 'आपत्कालीन निधी', body: 'नोकरी, आरोग्य किंवा अचानक गरजेच्या वेळी अत्यावश्यक खर्च भागवण्यासाठीचा निधी. अ‍ॅप आधी 3 महिने आणि नंतर 6 महिन्यांचे लक्ष्य दाखवते.', action: 'हा निधी सामान्य खरेदी किंवा सहलीसाठी वापरू नका.' },
  'debt-freedom': { en: 'Debt freedom', mr: 'कर्जमुक्ती योजना', body: 'सर्व कर्जांचे उरलेले पैसे, व्याज, किमान हप्ता आणि अपेक्षित कर्जमुक्त तारीख दाखवते. Save interest जास्त व्याजाचे कर्ज आधी कमी करते; Quick wins लहान कर्ज आधी संपवते.', action: 'प्रत्येक कर्ज payment योग्य खात्यातून नोंदवा आणि principal व interest वेगळे भरा.' },
  'goals': { en: 'Goals', mr: 'मोठ्या ध्येयांसाठी बचत', body: 'आपत्कालीन निधी, घर, सोने, प्रवास किंवा इतर मोठ्या ध्येयासाठी ठराविक रक्कम आणि तारीख ठेवता येते.', action: 'Add saving वापरून प्रत्येक बचतीची तारीख आणि ती कोणत्या खात्यात आहे ते नोंदवा.', tip: 'Goal saving ही खात्यातीलच राखीव रक्कम आहे; ती नवीन उत्पन्न नाही.' },
  'sinking-funds': { en: 'Sinking funds', mr: 'आधीच माहित असलेल्या खर्चासाठी निधी', body: 'वार्षिक विमा, दुरुस्ती, भेटवस्तू, वैद्यकीय खर्च किंवा सहल यांसारख्या भविष्यातील अपेक्षित खर्चासाठी हळूहळू पैसे बाजूला ठेवा.', action: 'Target आणि Needed by तारीख दिल्यावर अ‍ॅप दर महिन्याची आवश्यक रक्कम मोजते.', tip: 'दीर्घकालीन स्वप्नासाठी Goal वापरा; ठरलेला आगामी खर्च असेल तर Sinking fund वापरा.' },
  'category-budget': { en: 'Category budget', mr: 'प्रत्येक खर्च प्रकाराची मासिक मर्यादा', body: 'Food, Housing, Bills, Transport, Shopping इत्यादींसाठी महिन्याची जास्तीत जास्त मर्यादा ठरवा.', action: 'मर्यादा वास्तववादी ठेवा आणि महिन्यात वापर किती झाला ते पहा.' },
  'recurring-items': { en: 'Recurring items', mr: 'दर महिन्याला पुन्हा होणारे व्यवहार', body: 'पगार, भाडे, इंटरनेट किंवा EMI सारखी रक्कम एकदा तयार केल्यावर Monthly checklist मध्ये दर महिन्याला दिसते.', action: 'प्रत्यक्ष व्यवहार झाल्यावर Confirm करा; हे automatic bank payment नाही.' },

  'timeline-page': { en: 'Timeline', mr: 'संपूर्ण आर्थिक इतिहास', body: 'खर्च, उत्पन्न, transfers, Goals, कर्ज, मालमत्ता, budgets आणि जिंकलेले टप्पे तारीखवार आपोआप दिसतात.', action: 'Money, Plans आणि Wins filters वापरून हवी ती माहिती पहा.' },
  'cashflow-outlook': { en: 'Cash-flow outlook', mr: 'पुढील खातेशिल्लकीचा अंदाज', body: 'नियमित पगार आणि बिलांच्या तारखांवरून पुढील 30, 60 किंवा 90 दिवसांत खात्यांत किती पैसे राहू शकतात ते दाखवते.', action: 'नियमित व्यवहार आणि त्यांची तारीख बरोबर ठेवा.', tip: 'हा अंदाज आहे; अचानक खर्च किंवा नोंद न केलेला व्यवहार यात दिसणार नाही.' },
  'together-page': { en: 'Together', mr: 'धनी आणि सखीची एकत्र पाहणी', body: 'आठवड्याची छोटी money date, आर्थिक calendar, emergency runway आणि महिन्याचा आढावा एका शांत पानावर.', action: 'आठवड्यातून एकदा पाच मिनिटे एकत्र बसा; दोष न देता फक्त आकडे आणि एक पुढची कृती ठरवा.' },
  'money-date': { en: 'Money date', mr: 'आठवड्याची पाच मिनिटांची पैशांची चर्चा', body: 'या आठवड्यात काय चांगले झाले आणि पुढील सात दिवसांत एक कोणते काम करायचे ते दोघे लिहितात.', action: 'एक लहान आणि स्पष्ट कृती ठरवा—उदा. बिल भरणे किंवा आपत्कालीन निधीत पैसे ठेवणे.' },
  'money-calendar': { en: 'Money calendar', mr: 'पैशांचे कॅलेंडर', body: 'पगार, नियमित बिले, कर्जाचे हप्ते, Goal dates आणि नियोजित खर्च तारीखवार दाखवते.', action: 'महिन्याच्या सुरुवातीला मोठ्या तारखा तपासा.' },
  'emergency-runway': { en: 'Emergency runway', mr: 'उत्पन्न थांबल्यास पैसे किती महिने पुरतील', body: 'ध्येयांसाठी राखीव रक्कम सुरक्षित ठेवून उपलब्ध पैसे अत्यावश्यक मासिक खर्च किती महिने भागवू शकतात ते दाखवते.', action: 'पहिले 1 महिना, नंतर 3 आणि शेवटी 6 महिन्यांचे संरक्षण तयार करा.' },
  'close-month': { en: 'Close the month', mr: 'महिन्याचा आढावा पूर्ण करा', body: 'महिन्याचा खर्च, कर्ज कमी झालेले पैसे, Goal saving, एक शिकवण आणि पुढील महिन्याचे एक लक्ष जतन करते.', action: 'महिना बंद करण्यापूर्वी सर्व खात्यांची खरी शिल्लक तपासा.', tip: 'Close केल्याने कोणतीही नोंद delete किंवा lock होत नाही.' },

  'settings-page': { en: 'Settings', mr: 'अ‍ॅपची मूलभूत सेटिंग्ज', body: 'मुख्य चलन, पगाराची तारीख, विनिमय दर, फोन shortcut आणि data backup येथे सांभाळा.', action: 'चलन किंवा पगाराची तारीख बदलल्यास Save settings करा.' },
  'dashboard-currency': { en: 'Dashboard currency', mr: 'सर्व आकडे दाखवायचे मुख्य चलन', body: 'AED, MVR, INR किंवा USD पैकी निवडलेल्या चलनात dashboard ची एकूण रक्कम दिसते. मूळ व्यवहाराचे चलन बदलत नाही.', action: 'तुम्ही रोज विचार करता ते चलन निवडा.' },
  'salary-day': { en: 'Salary day each month', mr: 'दर महिन्याचा पगाराचा दिवस', body: 'पगार साधारण कोणत्या तारखेला येतो ते द्या. Safe-to-spend आणि cash-flow यासाठी ही तारीख वापरली जाते.', action: '1 ते 31 मधील दिवस निवडा.' },
  'exchange-rates': { en: 'USD exchange rates', mr: 'USD चा हाताने दिलेला विनिमय दर', body: '1 USD इतके AED, MVR किंवा INR किती होतात ते येथे लिहा. वेगवेगळ्या चलनांतील रकमा एकत्र मोजण्यासाठी हा दर वापरला जातो.', action: 'महिन्यातून एकदा विश्वसनीय स्रोत पाहून दर दुरुस्त करा.', tip: 'Refresh rates बटण metals आणि crypto साठी आहे; हे currency rates आपोआप बदलत नाहीत.' },
  'backup': { en: 'Backup, Restore and CSV', mr: 'तुमच्या माहितीची सुरक्षित प्रत', body: 'Backup पूर्ण अ‍ॅप माहितीची JSON प्रत डाउनलोड करते. Restore त्या प्रतीतून माहिती परत आणते. CSV फक्त व्यवहारांची साधी यादी देते.', action: 'महिन्याच्या शेवटी एक Backup सुरक्षित ठेवा.', tip: 'Restore करण्यापूर्वी योग्य फाइल निवडली आहे याची खात्री करा.' },
  'free-independent': { en: 'Free and independent', mr: 'पूर्णपणे मोफत आणि स्वतंत्र', body: 'अ‍ॅप वापरण्यासाठी ChatGPT subscription, paid market API किंवा paid bank connection लागत नाही.', action: 'तुम्ही नोंदवलेली माहिती वापरून अ‍ॅप चालते.' },

  'field-date': { en: 'Date', mr: 'व्यवहाराची तारीख', body: 'पैसे प्रत्यक्ष आले किंवा गेले त्या दिवसाची तारीख निवडा.', action: 'जुनी नोंद करताना आजची तारीख चुकीने वापरू नका.' },
  'field-amount': { en: 'Amount', mr: 'रक्कम', body: 'प्रत्यक्ष आलेली, गेलेली किंवा ठरवलेली संख्या टाका.', action: 'दशांश आणि चलन काळजीपूर्वक तपासा.' },
  'field-currency': { en: 'Currency', mr: 'चलन', body: 'ही रक्कम AED, MVR, INR किंवा USD पैकी कोणत्या चलनात आहे ते निवडा.', action: 'बँक व्यवहारावर दिसणारे मूळ चलन निवडा.' },
  'field-account': { en: 'Account', mr: 'संबंधित खाते', body: 'पैसे ज्या बँक, रोख किंवा wallet खात्यात आले किंवा गेले ते खाते निवडा.', action: 'योग्य खाते निवडल्यावर त्याची शिल्लक आपोआप बदलते.' },
  'field-category': { en: 'Category / reason', mr: 'पैसे कशासाठी होते', body: 'उत्पन्न किंवा खर्चाचा योग्य प्रकार निवडा. यावर budget आणि 40–30–20–10 गणना अवलंबून असते.', action: 'सर्वात जवळचा खरा प्रकार निवडा.' },
  'field-person': { en: 'Paid or received by', mr: 'कोणी पैसे दिले किंवा घेतले', body: 'हा व्यवहार धनी, सखी किंवा Shared यापैकी कोणाशी संबंधित आहे ते निवडा.', action: 'ज्याच्या खात्यातून व्यवहार झाला त्याचे नाव निवडा; दोघांचा असेल तर Shared.' },
  'field-note': { en: 'Note', mr: 'छोटी ओळख', body: 'नंतर व्यवहार समजण्यासाठी छोटी माहिती लिहा.', action: 'उदा. महिन्याचे किराणा, ऑगस्ट पगार किंवा कार दुरुस्ती. आवश्यक नसल्यास रिकामे ठेवा.' },
  'field-name': { en: 'Name', mr: 'ओळखण्यास सोपे नाव', body: 'खाते, कर्ज, Goal किंवा नियमित नोंद लगेच समजेल असे स्पष्ट नाव द्या.', action: 'उदा. Main MVR account, Credit card किंवा Emergency fund.' },
  'field-choice': { en: 'Choose an option', mr: 'योग्य पर्याय निवडा', body: 'वर-खाली scroll करून मधोमध दिसणारा योग्य पर्याय निवडा.', action: 'Continue करण्यापूर्वी निवड पुन्हा पहा.' },
  'field-text': { en: 'Enter information', mr: 'माहिती लिहा', body: 'या प्रश्नाला लागू होणारी थोडक्यात खरी माहिती लिहा.', action: 'अंदाजाऐवजी शक्य तितकी अचूक माहिती वापरा.' },
  'account-type': { en: 'Account type', mr: 'खात्याचा प्रकार', body: 'Bank account, हातातील Cash किंवा Mobile wallet यापैकी योग्य प्रकार निवडा.', action: 'यामुळे खाते ओळखायला सोपे होते; गणना समान राहते.' },
  'starting-balance': { en: 'Starting balance', mr: 'नोंद सुरू करतानाची खरी शिल्लक', body: 'Track from तारखेला त्या खात्यात प्रत्यक्ष किती पैसे होते ते लिहा. पुढील व्यवहार त्यावर जोडले किंवा वजा केले जातात.', action: 'आजपासून सुरुवात करत असाल तर आजची वास्तविक शिल्लक टाका.', tip: 'जुने पगार आणि खर्च पुन्हा टाकून शिल्लक तयार करू नका.' },
  'track-from': { en: 'Track from', mr: 'खाते मोजायला सुरुवात केलेली तारीख', body: 'Starting balance कोणत्या दिवसापासून लागू आहे ती तारीख.', action: 'Starting balance पाहिलेल्या दिवसाची तारीख निवडा.' },
  'actual-balance': { en: 'Actual balance', mr: 'बँकेत आत्ता दिसणारी खरी शिल्लक', body: 'बँक app, cash किंवा wallet मध्ये प्रत्यक्ष दिसणारी सध्याची रक्कम.', action: 'अ‍ॅपच्या शिल्लकीशी तुलना करून फरक असल्यास correction जतन करा.', tip: 'रोजच्या खर्चाऐवजी correction वापरू नका; आधी हरवलेली नोंद शोधा.' },
  'transfer-from': { en: 'From account', mr: 'पैसे ज्या खात्यातून गेले', body: 'Transfer सुरू झालेलं खाते निवडा.', action: 'या खात्याची शिल्लक कमी होईल.' },
  'transfer-to': { en: 'To account', mr: 'पैसे ज्या खात्यात आले', body: 'Transfer मिळालेलं खाते निवडा.', action: 'या खात्याची शिल्लक वाढेल.' },
  'transfer-sent': { en: 'Amount sent', mr: 'पाठवलेली रक्कम', body: 'पहिल्या खात्यातून प्रत्यक्ष वजा झालेली रक्कम.', action: 'बँक शुल्क असेल तर statement पाहून खरी रक्कम टाका.' },
  'transfer-received': { en: 'Amount received', mr: 'दुसऱ्या खात्यात मिळालेली रक्कम', body: 'दुसऱ्या खात्यात प्रत्यक्ष जमा झालेली रक्कम.', action: 'चलन बदलले असल्यास ही रक्कम Amount sent पेक्षा वेगळी असू शकते.' },
  'target-amount': { en: 'Target amount', mr: 'पूर्ण करायचे एकूण लक्ष्य', body: 'Goal किंवा निधी पूर्ण होण्यासाठी लागणारी एकूण रक्कम.', action: 'अवास्तव round number ऐवजी खरा अंदाज वापरा.' },
  'saved-amount': { en: 'Already saved', mr: 'आधीच बाजूला ठेवलेली रक्कम', body: 'या Goal किंवा निधीसाठी आजपर्यंत प्रत्यक्ष राखीव ठेवलेले पैसे.', action: 'खात्यात खरोखर उपलब्ध असलेलीच रक्कम लिहा.' },
  'target-date': { en: 'Target / needed date', mr: 'पैसे कधीपर्यंत हवे', body: 'Goal पूर्ण करायचा किंवा खर्च करायचा अपेक्षित दिवस.', action: 'तारीख माहित नसेल तर रिकामी ठेवू शकता.' },
  'asset-type': { en: 'Asset type', mr: 'मालमत्तेचा प्रकार', body: 'हाताने किंमत देणारी मालमत्ता, precious metal किंवा crypto यापैकी निवडा.', action: 'बाजारभाव हवा असल्यास योग्य metal किंवा crypto प्रकार निवडा.' },
  'asset-symbol': { en: 'Asset', mr: 'नेमकी मालमत्ता', body: 'Gold, Silver, Bitcoin इत्यादी नेमका बाजार symbol निवडा.', action: 'चुकीचा symbol निवडल्यास किंमत चुकीची येईल.' },
  'asset-quantity': { en: 'Amount / quantity', mr: 'तुमच्याकडे असलेले प्रमाण', body: 'Metal साठी troy ounces, crypto साठी units आणि इतर प्रकारासाठी लागू असलेले प्रमाण टाका.', action: 'खरेदी किंवा विक्रीनंतर प्रमाण बदला.' },
  'asset-value': { en: 'Current total value', mr: 'आजची एकूण अंदाजे किंमत', body: 'Manual asset आज विकल्यास साधारण किती मूल्य मिळेल ते लिहा.', action: 'किंमत बदलल्यावर हाताने अपडेट करा.' },
  'debt-original': { en: 'Original amount', mr: 'कर्ज घेतानाची मूळ रक्कम', body: 'कर्ज किंवा card balance सुरू झाल्यावेळी एकूण किती होते.', action: 'जुना statement किंवा loan document वापरा.' },
  'debt-remaining': { en: 'Remaining now', mr: 'आत्ता फेडायची उरलेली रक्कम', body: 'आजच्या statement प्रमाणे अजून किती कर्ज बाकी आहे.', action: 'कर्ज payment नोंदवल्यावर principal इतकी रक्कम कमी होते.' },
  'debt-apr': { en: 'Annual interest %', mr: 'वर्षाचे व्याज टक्के', body: 'कर्जावर एका वर्षासाठी आकारला जाणारा APR व्याजदर.', action: 'loan document किंवा card statement मधील टक्केवारी टाका; व्याज नसेल तर 0.' },
  'debt-minimum': { en: 'Minimum monthly payment', mr: 'दर महिन्याचा किमान हप्ता', body: 'उशीर किंवा दंड टाळण्यासाठी महिन्याला कमीत कमी भरायची रक्कम.', action: 'अ‍ॅप प्रथम प्रत्येक कर्जाचा किमान हप्ता सुरक्षित ठेवते.' },
  'debt-payment-day': { en: 'Usual payment day', mr: 'साधारण हप्ता भरण्याचा दिवस', body: 'दर महिन्याला हप्ता कोणत्या तारखेला भरायचा असतो.', action: '1 ते 31 मधील दिवस द्या; माहित नसेल तर रिकामे ठेवा.' },
  'debt-payoff-date': { en: 'Target payoff date', mr: 'कर्ज पूर्ण संपवायची लक्ष्य तारीख', body: 'हे कर्ज कधीपर्यंत शून्य करायचे ते ठरवा.', action: 'वेगवान पण शक्य अशी तारीख निवडा.' },
  'debt-extra': { en: 'Extra each month', mr: 'दर महिन्याला अतिरिक्त कर्जफेड', body: 'किमान हप्त्यांपेक्षा जास्त किती रक्कम दिल्यास वेळ आणि व्याज किती वाचेल याची चाचणी.', action: 'ही फक्त what-if गणना आहे; खरी नोंद बदलत नाही.' },
  'debt-pay-from': { en: 'Pay from', mr: 'हप्ता ज्या खात्यातून गेला', body: 'कर्ज payment प्रत्यक्ष ज्या बँक किंवा cash खात्यातून झाला ते निवडा.', action: 'या खात्याची शिल्लक payment इतकी कमी होईल.' },
  'debt-total': { en: 'Total leaving account', mr: 'खात्यातून गेलेली पूर्ण रक्कम', body: 'Principal, interest आणि fees धरून खात्यातून प्रत्यक्ष वजा झालेली एकूण रक्कम.', action: 'बँक statement वरील debit amount वापरा.' },
  'debt-principal': { en: 'Principal', mr: 'मूळ कर्ज कमी करणारी रक्कम', body: 'Payment मधील फक्त कर्जाची उरलेली शिल्लक कमी करणारा भाग.', action: 'statement मध्ये principal/मूळ रक्कम म्हणून दाखवलेला भाग टाका.' },
  'debt-interest': { en: 'Interest / fees', mr: 'व्याज आणि शुल्क', body: 'Payment मधील कर्जाची मूळ शिल्लक कमी न करणारा भाग.', action: 'Total आणि Principal मधील फरक तपासा.' },
  'goal-account': { en: 'Where is it held?', mr: 'Goal चे पैसे कोणत्या खात्यात आहेत', body: 'राखीव बचत प्रत्यक्ष कोणत्या बँक, cash किंवा wallet खात्यात ठेवली आहे ते निवडा.', action: 'ठराविक खाते नसेल तर Not assigned निवडा; रक्कम तरीही राखीव मोजली जाईल.' },
  'recurring-kind': { en: 'Recurring type', mr: 'दर महिन्याला येणारे की जाणारे पैसे', body: 'Salary सारखे पैसे येत असतील तर Income; Rent किंवा bill सारखे पैसे जात असतील तर Expense.', action: 'योग्य प्रकार निवडल्यावर category पर्याय बदलतात.' },
  'recurring-day': { en: 'Day each month', mr: 'दर महिन्याची तारीख', body: 'हा नियमित व्यवहार साधारण कोणत्या दिवशी होतो.', action: '1 ते 31 मधील दिवस निवडा.' },
  'weekly-win': { en: 'What went well?', mr: 'या आठवड्यात पैशांबाबत काय चांगले झाले', body: 'छोटी जिंकलेली गोष्ट लिहा—खर्च नोंदवला, बिल वेळेवर भरले किंवा बचत केली.', action: 'दोष शोधू नका; एक खरी सकारात्मक गोष्ट लिहा.' },
  'weekly-action': { en: 'Our one next action', mr: 'पुढील सात दिवसांचे एक काम', body: 'दोघांनी मान्य केलेले एक छोटे आणि पूर्ण करता येणारे काम.', action: 'उदा. Friday ला credit card भरणे किंवा Goal मध्ये ठराविक रक्कम ठेवणे.' },
  'month-note': { en: 'What should we remember?', mr: 'या महिन्यातून काय शिकायचे', body: 'पुढे उपयोगी पडेल अशी एक खरी शिकवण लिहा.', action: 'दोष न देता काय काम केले किंवा कुठे सुधारणा हवी ते लिहा.' },
  'month-focus': { en: 'One focus for next month', mr: 'पुढील महिन्याचे एक मुख्य लक्ष', body: 'पुढच्या महिन्यात सर्वात महत्त्वाची एक आर्थिक गोष्ट ठरवा.', action: 'एकच स्पष्ट लक्ष निवडा म्हणजे दोघांनाही ते लक्षात राहील.' },
  'runway-drop': { en: 'Monthly income reduction', mr: 'उत्पन्न किती टक्के कमी होईल', body: 'What-if चाचणीत पगार कमी झाल्यास emergency runway कशी बदलेल ते पाहण्यासाठी टक्केवारी निवडा.', action: 'ही चाचणी खरी माहिती बदलत नाही.' },
  'runway-expense': { en: 'Unexpected expense', mr: 'अचानक आलेला अतिरिक्त खर्च', body: 'Emergency runway वर परिणाम पाहण्यासाठी काल्पनिक अचानक खर्च टाका.', action: 'ही फक्त planning चाचणी आहे.' },
  'budget-amount': { en: 'Category limit', mr: 'या प्रकारासाठी महिन्याची मर्यादा', body: 'या category वर एका महिन्यात जास्तीत जास्त किती खर्च करायचा ते ठरवा.', action: 'मागील खरा खर्च पाहून साध्य मर्यादा ठेवा.' }
};

const SAKHI_GUIDE_GROUPS = [
  { title: 'दररोज वापरायच्या गोष्टी', keys: ['today-page', 'safe-spend', 'add-spend', 'add-income', 'transfer', 'monthly-checklist', 'phone-shortcut'] },
  { title: 'खाती आणि संपत्ती', keys: ['money-page', 'accounts', 'net-worth', 'live-rates', 'assets', 'wealth-journey', 'best-next-moves'] },
  { title: 'पगार, कर्ज आणि बचत', keys: ['allocation', 'payday-assistant', 'emergency-fund', 'debt-freedom', 'goals', 'sinking-funds', 'category-budget', 'recurring-items'] },
  { title: 'इतिहास आणि दोघांची पाहणी', keys: ['timeline-page', 'cashflow-outlook', 'together-page', 'money-date', 'money-calendar', 'emergency-runway', 'close-month'] },
  { title: 'सेटिंग्ज आणि सुरक्षितता', keys: ['settings-page', 'dashboard-currency', 'salary-day', 'exchange-rates', 'backup', 'free-independent'] }
];

const SAKHI_FIELD_HELP = {
  authEmail: 'auth-email', authPassword: 'auth-password',
  quickDate: 'field-date', transactionDate: 'field-date', transferDate: 'field-date', debtPaymentDate: 'field-date', goalContributionDate: 'field-date',
  quickAmount: 'field-amount', transactionAmount: 'field-amount', recurringAmount: 'field-amount', goalContributionAmount: 'field-amount',
  quickCurrency: 'field-currency', transactionCurrency: 'field-currency', accountCurrency: 'field-currency', assetCurrency: 'field-currency', debtCurrency: 'field-currency', goalCurrency: 'field-currency', recurringCurrency: 'field-currency', fundCurrency: 'field-currency',
  quickAccount: 'field-account', transactionAccount: 'field-account', recurringAccount: 'field-account',
  quickCategory: 'field-category', transactionCategory: 'field-category', recurringCategory: 'field-category',
  quickPaidBy: 'field-person', transactionPaidBy: 'field-person', recurringPaidBy: 'field-person',
  quickNote: 'field-note', transactionNote: 'field-note', transferNote: 'field-note', accountNotes: 'field-note', assetNotes: 'field-note', debtPaymentNote: 'field-note', goalContributionNote: 'field-note', recurringNote: 'field-note', fundNote: 'field-note', checkupNote: 'field-note',
  accountName: 'field-name', assetName: 'field-name', debtName: 'field-name', goalName: 'field-name', recurringName: 'field-name', fundName: 'field-name',
  baseCurrency: 'dashboard-currency', paydayDay: 'salary-day', rateAED: 'exchange-rates', rateMVR: 'exchange-rates', rateINR: 'exchange-rates',
  accountType: 'account-type', accountOpening: 'starting-balance', accountDate: 'track-from', actualBalance: 'actual-balance',
  transferFrom: 'transfer-from', transferTo: 'transfer-to', transferAmount: 'transfer-sent', transferReceived: 'transfer-received',
  fundTarget: 'target-amount', goalTarget: 'target-amount', fundSaved: 'saved-amount', goalStarting: 'saved-amount', fundDue: 'target-date', goalDue: 'target-date',
  assetType: 'asset-type', assetSymbol: 'asset-symbol', assetQuantity: 'asset-quantity', assetManualValue: 'asset-value',
  debtOriginal: 'debt-original', debtRemaining: 'debt-remaining', debtApr: 'debt-apr', debtMinimum: 'debt-minimum', debtPaymentDay: 'debt-payment-day', debtDue: 'debt-payoff-date', debtExtra: 'debt-extra',
  debtPaymentAccount: 'debt-pay-from', debtPaymentTotal: 'debt-total', debtPaymentPrincipal: 'debt-principal', debtPaymentInterest: 'debt-interest',
  goalContributionAccount: 'goal-account', recurringKind: 'recurring-kind', recurringDay: 'recurring-day',
  moneyDateWin: 'weekly-win', moneyDateAction: 'weekly-action', monthCloseNote: 'month-note', monthCloseFocus: 'month-focus',
  runwayDrop: 'runway-drop', runwayExpense: 'runway-expense', quickExpenseLink: 'phone-shortcut'
};

let state = structuredClone(DEFAULT);
let db = null;
let currentUser = null;
let householdId = null;
let stateKey = '';
let pendingKey = '';
let realtimeChannel = null;
let realtimeTimer = null;
let priceRefresh = null;
let currentPage = 'today';
let wealthChartMode = 'actual';
let timelineFilter = 'all';
let cashflowDays = 30;
let calendarMonth = '';
let toastTimer = null;
let marathiHelpReturnFocus = null;
let pendingQuickAction = new URLSearchParams(location.search).get('quick') || '';
let pendingRestoreData = null;

const $ = id => document.getElementById(id);
const clone = value => structuredClone(value);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]);
const safeParse = value => { try { return JSON.parse(value); } catch (_error) { return null; } };
const localDate = date => {
  const d = date || new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};
const today = () => localDate();
const monthKey = (date = today()) => date.slice(0, 7);
const monthStart = (date = today()) => `${monthKey(date)}-01`;
const cleanCurrency = value => String(value || '').trim();
const currencyOptions = selected => CURRENCIES.map(c => `<option${c === selected ? ' selected' : ''}>${c}</option>`).join('');

function normalizeState(raw) {
  const input = raw || {};
  const next = Object.assign(clone(DEFAULT), input);
  next.version = VERSION;
  next.settings = Object.assign({}, DEFAULT.settings, input.settings || {});
  next.settings.rates = Object.assign({}, DEFAULT.settings.rates, input.settings?.rates || {});
  next.settings.base = CURRENCIES.includes(next.settings.base) ? next.settings.base : 'MVR';
  next.settings.lastCurrency = CURRENCIES.includes(next.settings.lastCurrency) ? next.settings.lastCurrency : next.settings.base;
  next.member = Object.assign({}, DEFAULT.member, input.member || {});
  next.settings.debtStrategy = ['avalanche', 'snowball'].includes(next.settings.debtStrategy) ? next.settings.debtStrategy : 'avalanche';
  for (const key of ['people', 'transactions', 'goals', 'debts', 'assets', 'accounts', 'recurring', 'contributions', 'snapshots', 'checkups', 'sinkingFunds', 'weeklyReviews']) {
    next[key] = Array.isArray(next[key]) ? next[key] : [];
  }
  next.prices = next.prices && typeof next.prices === 'object' ? next.prices : {};
  const sourceBudgets = input.budgets && typeof input.budgets === 'object' ? input.budgets : DEFAULT.budgets;
  next.budgets = Object.fromEntries(Object.entries(sourceBudgets).map(([category, value]) => [
    category,
    typeof value === 'object'
      ? { amount: Number(value.amount) || 0, currency: cleanCurrency(value.currency) || next.settings.base }
      : { amount: Number(value) || 0, currency: next.settings.base }
  ]));
  return next;
}

function cache() {
  if (stateKey) localStorage.setItem(stateKey, JSON.stringify(state));
}

function loadScopedState() {
  stateKey = `our_dhan_v9:${householdId}:${currentUser.id}`;
  pendingKey = `our_dhan_pending_v9:${householdId}:${currentUser.id}`;
  const legacyStateKeys = [
    `our_budget_v8:${householdId}:${currentUser.id}`,
    `our_budget_v7:${householdId}:${currentUser.id}`,
    `our_budget_v6:${householdId}:${currentUser.id}`,
    `our_budget_v5:${householdId}:${currentUser.id}`,
    'our_budget_v4', 'our_budget_v3', 'our_budget_v2'
  ];
  const legacyPendingKeys = [
    `our_budget_pending_v8:${householdId}:${currentUser.id}`,
    `our_budget_pending_v7:${householdId}:${currentUser.id}`,
    `our_budget_pending_v6:${householdId}:${currentUser.id}`,
    `our_budget_pending_v5:${householdId}:${currentUser.id}`
  ];
  let raw = safeParse(localStorage.getItem(stateKey));
  if (!raw) {
    for (const key of legacyStateKeys) {
      raw = safeParse(localStorage.getItem(key));
      if (raw) break;
    }
  }
  if (!localStorage.getItem(pendingKey)) {
    for (const key of legacyPendingKeys) {
      const queued = safeParse(localStorage.getItem(key));
      if (Array.isArray(queued) && queued.length) {
        localStorage.setItem(pendingKey, JSON.stringify(queued));
        break;
      }
    }
  }
  state = normalizeState(raw);
  cache();
}

function pending() { return safeParse(localStorage.getItem(pendingKey)) || []; }
function savePending(items) {
  if (!pendingKey) return;
  if (items.length) localStorage.setItem(pendingKey, JSON.stringify(items));
  else localStorage.removeItem(pendingKey);
  updateSyncStatus();
}
function enqueue(operation) {
  const items = pending();
  items.push(Object.assign({ queueId: crypto.randomUUID(), createdAt: new Date().toISOString() }, operation));
  savePending(items);
}

function updateSyncStatus(message = '') {
  if (!$('syncStatus')) return;
  const count = pendingKey ? pending().length : 0;
  $('syncStatus').textContent = message || (count
    ? `${count} change${count === 1 ? '' : 's'} waiting to sync`
    : currentUser ? 'Synced between both phones' : 'Offline');
}

function usd(value, currency) {
  const rate = Number(state.settings.rates[cleanCurrency(currency)]) || 1;
  return Number(value || 0) / rate;
}
function fromUSD(value, currency) {
  const rate = Number(state.settings.rates[cleanCurrency(currency)]) || 1;
  return Number(value || 0) * rate;
}
function money(value, currency = state.settings.base) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(value) || 0);
  } catch (_error) {
    return `${currency} ${(Number(value) || 0).toFixed(2)}`;
  }
}
function baseMoney(usdValue) { return money(fromUSD(usdValue, state.settings.base), state.settings.base); }
function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', options).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}
function rememberCurrency(currency) {
  if (!CURRENCIES.includes(currency)) return;
  state.settings.lastCurrency = currency;
  cache();
}
function accountName(id) { return state.accounts.find(a => a.id === id)?.name || ''; }
function activeAccounts() { return state.accounts.filter(a => a.active !== false); }
function activeGoals() { return state.goals.filter(g => g.active !== false); }
function activeDebts() { return state.debts.filter(d => d.active !== false || d.remaining > 0); }
function activeSinkingFunds() { return state.sinkingFunds.filter(fund => fund.active !== false && fund.saved + .005 < fund.target); }
function householdPeople() { return [...new Set([...state.people, state.member.displayName].map(name => String(name || '').trim()).filter(Boolean))]; }
function defaultPerson() { return state.member.displayName || 'Shared'; }
function peopleOptions(selected = defaultPerson()) {
  return [...new Set([...householdPeople(), 'Shared', selected].filter(Boolean))]
    .map(name => `<option${name === selected ? ' selected' : ''}>${esc(name)}</option>`).join('');
}

function toast(message) {
  const element = $('toast');
  if (!element) return;
  clearTimeout(toastTimer);
  element.textContent = message;
  element.classList.remove('hidden');
  toastTimer = setTimeout(() => element.classList.add('hidden'), 2600);
}
function celebrate() {
  if (!state.settings.funMode || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = $('confetti');
  const colors = ['#31846c', '#f1b94b', '#e96d5b', '#557fa3'];
  root.innerHTML = Array.from({ length: 24 }, (_, i) => `<i style="left:${5 + Math.random() * 90}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * .25}s;--drift:${-80 + Math.random() * 160}px"></i>`).join('');
  setTimeout(() => { root.innerHTML = ''; }, 1700);
}
function haptic() { if (navigator.vibrate) navigator.vibrate(18); }

function openModal(title, html) {
  $('modalTitle').textContent = title;
  $('modalContent').innerHTML = html;
  $('modal').classList.remove('hidden');
  const form = $('modalContent').querySelector('form');
  $('modal').classList.toggle('flowModal', !!form);
  attachMarathiHelp($('modalContent'));
  prepareInlineControls($('modalContent'));
  if (form) setupFormFlow(form);
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const activeStep = $('modalContent').querySelector('.flowStep.active');
    const control = activeStep?.querySelector('input:not([type="hidden"]):not(.inlineSelectSource), textarea, .inlineOptionRail')
      || $('modalContent').querySelector('input:not([type="hidden"]):not(.inlineSelectSource), textarea, .inlineOptionRail, button:not(.marathiHelpStar)');
    control?.focus();
  }, 80);
}
function closeModal() {
  $('modal').classList.add('hidden');
  $('modal').classList.remove('flowModal');
  $('modalContent').innerHTML = '';
  document.body.style.overflow = '';
}

function marathiHelpButton(key) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'marathiHelpStar';
  button.textContent = '*';
  button.setAttribute('aria-label', 'मराठीत समजावून सांगा');
  button.title = 'मराठी मदत';
  button.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openMarathiHelp(key);
  });
  return button;
}

function marathiHelpKeyForControl(control) {
  if (SAKHI_FIELD_HELP[control.id]) return SAKHI_FIELD_HELP[control.id];
  if (/^budgetAmount\d+$/.test(control.id)) return 'budget-amount';
  if (/^budgetCurrency\d+$/.test(control.id)) return 'field-currency';
  if (/^checkupBalance\d+$/.test(control.id)) return 'actual-balance';
  if (control.type === 'date') return 'field-date';
  if (control.type === 'number' || control.type === 'range') return 'field-amount';
  if (control.tagName === 'SELECT') return 'field-choice';
  if (control.tagName === 'TEXTAREA') return 'field-note';
  if (['text', 'email', 'password', 'url'].includes(control.type)) return 'field-text';
  return '';
}

function decorateMarathiHelp(target) {
  const key = target.dataset.help;
  if (!key || !SAKHI_HELP[key] || target.dataset.marathiHelpReady) return;
  target.dataset.marathiHelpReady = 'true';
  target.classList.add('marathiHelpTarget');
  const helpButton = marathiHelpButton(key);
  if (target.matches('label')) {
    const textNode = [...target.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    if (!textNode) {
      const control = target.querySelector('input,select,textarea');
      const block = target.querySelector(':scope > div');
      if (!block) return;
      target.dataset.fieldLabel = control?.getAttribute('aria-label') || SAKHI_HELP[key].en;
      block.classList.add('nestedFieldHelpCaption');
      block.append(helpButton);
      return;
    }
    const caption = document.createElement('span');
    caption.className = 'fieldHelpCaption';
    const labelText = textNode.textContent.trim();
    target.dataset.fieldLabel = labelText;
    caption.append(document.createTextNode(labelText), helpButton);
    textNode.replaceWith(caption);
    return;
  }
  if (target.matches('button')) {
    const parent = target.parentElement;
    if (!parent || parent.classList.contains('marathiHelpButtonWrap')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'marathiHelpButtonWrap';
    parent.insertBefore(wrapper, target);
    wrapper.append(target, helpButton);
    return;
  }
  target.append(helpButton);
}

function attachMarathiHelp(root = document) {
  const controls = [
    ...(root.matches?.('input,select,textarea') ? [root] : []),
    ...(root.querySelectorAll?.('input,select,textarea') || [])
  ];
  controls.forEach(control => {
    if (control.type === 'hidden' || control.type === 'file') return;
    const label = control.closest('label');
    const key = marathiHelpKeyForControl(control);
    if (label && key && !label.dataset.help) label.dataset.help = key;
  });
  const targets = [
    ...(root.matches?.('[data-help]') ? [root] : []),
    ...(root.querySelectorAll?.('[data-help]') || [])
  ];
  targets.forEach(decorateMarathiHelp);
}

function showMarathiHelp(title, html) {
  const wasHidden = $('marathiHelpModal').classList.contains('hidden');
  if (wasHidden) marathiHelpReturnFocus = document.activeElement;
  $('marathiHelpTitle').textContent = title;
  $('marathiHelpContent').innerHTML = html;
  $('marathiHelpModal').classList.remove('hidden');
  if (!$('modal').classList.contains('hidden')) $('modal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('marathiHelpContent').querySelector('button')?.focus(), 80);
}

function closeMarathiHelp() {
  $('marathiHelpModal').classList.add('hidden');
  $('marathiHelpContent').innerHTML = '';
  $('modal').removeAttribute('aria-hidden');
  document.body.style.overflow = $('modal').classList.contains('hidden') ? '' : 'hidden';
  const returnFocus = marathiHelpReturnFocus;
  marathiHelpReturnFocus = null;
  if (returnFocus?.isConnected) setTimeout(() => returnFocus.focus(), 0);
}

function openSakhiGuide() {
  const groups = SAKHI_GUIDE_GROUPS.map((group, index) => `<details class="sakhiGuideGroup"${index === 0 ? ' open' : ''}>
    <summary>${esc(group.title)}</summary>
    <div class="sakhiTopicGrid">${group.keys.map(key => {
      const item = SAKHI_HELP[key];
      return `<button class="sakhiTopic" type="button" onclick="openMarathiHelp('${esc(key)}')"><b lang="mr">${esc(item.mr)}</b><small>${esc(item.en)}</small></button>`;
    }).join('')}</div>
  </details>`).join('');
  showMarathiHelp('सखीचा मराठी मार्गदर्शक', `<div class="sakhiGuide" lang="mr">
    <div class="sakhiGuideIntro"><b>Our DHAN समजून घेणे आता सोपे आहे</b>स्क्रीनवर जिथे लहान <strong>*</strong> दिसेल तिथे टॅप करा. त्या प्रश्नाचा किंवा feature चा अर्थ, काय करायचे आणि कोणती चूक टाळायची हे मराठीत दिसेल.</div>
    <div class="sakhiGuideGroups">${groups}</div>
  </div>`);
}

function openMarathiHelp(key) {
  const item = SAKHI_HELP[key];
  if (!item) { openSakhiGuide(); return; }
  showMarathiHelp('मराठी मदत', `<div class="sakhiHelpDetail" lang="mr">
    <div class="sakhiHelpHero"><span>* सखी मार्गदर्शक</span><h3>${esc(item.mr)}</h3><small>English: ${esc(item.en)}</small></div>
    <div class="sakhiHelpBlocks">
      <div class="sakhiHelpBlock"><b>याचा अर्थ काय?</b><p>${esc(item.body)}</p></div>
      <div class="sakhiHelpBlock"><b>काय करायचे?</b><p>${esc(item.action)}</p></div>
      ${item.tip ? `<div class="sakhiHelpBlock warning"><b>लक्षात ठेवा</b><p>${esc(item.tip)}</p></div>` : ''}
    </div>
    <div class="sakhiHelpActions"><button class="secondary" type="button" onclick="openSakhiGuide()">संपूर्ण मार्गदर्शक</button><button class="primary" type="button" onclick="closeMarathiHelp()">समजले</button></div>
  </div>`);
}

function numberPrecision(input) {
  const step = input.getAttribute('step');
  if (!step || step === 'any') return 0;
  const match = String(step).match(/\.(\d+)/);
  return Math.min(8, match ? match[1].length : 0);
}

function formatWheelNumber(input, value) {
  if (!Number.isFinite(value)) return '—';
  const precision = numberPrecision(input);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: precision, maximumFractionDigits: precision }).format(value);
}

function nudgeInlineNumber(input, direction, units = 1) {
  if (input.disabled) return;
  const step = input.step && input.step !== 'any' ? Number(input.step) : 1;
  const min = input.hasAttribute('min') ? Number(input.min) : -Infinity;
  const max = input.hasAttribute('max') ? Number(input.max) : Infinity;
  let value = input.value === '' ? (Number.isFinite(min) ? min : 0) : Number(input.value);
  value += direction * step * units;
  value = Math.max(min, Math.min(max, value));
  input.value = numberPrecision(input) ? value.toFixed(numberPrecision(input)) : String(Math.round(value));
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  updateInlineNumber(input);
  haptic();
}

function updateInlineNumber(input) {
  const shell = input.closest('.inlineNumberWheel');
  if (!shell) return;
  const step = input.step && input.step !== 'any' ? Number(input.step) : 1;
  const min = input.hasAttribute('min') ? Number(input.min) : -Infinity;
  const max = input.hasAttribute('max') ? Number(input.max) : Infinity;
  const value = input.value === '' ? (Number.isFinite(min) ? min : 0) : Number(input.value);
  const before = value - step;
  const after = value + step;
  shell.querySelector('.numberBefore').textContent = before < min ? '—' : formatWheelNumber(input, before);
  shell.querySelector('.numberAfter').textContent = after > max ? '—' : formatWheelNumber(input, after);
}

function enhanceNumberInput(input) {
  if (input.dataset.inlineWheelReady) return;
  input.dataset.inlineWheelReady = 'true';
  input.classList.add('inlineNumberInput');
  input.inputMode = numberPrecision(input) ? 'decimal' : 'numeric';
  const shell = document.createElement('div');
  shell.className = 'inlineNumberWheel';
  input.parentNode.insertBefore(shell, input);
  shell.innerHTML = '<div class="numberNudge numberAfter" role="button" tabindex="0" aria-label="Increase"></div>';
  shell.appendChild(input);
  shell.insertAdjacentHTML('beforeend', '<div class="numberNudge numberBefore" role="button" tabindex="0" aria-label="Decrease"></div><small>Swipe vertically or tap the centre number to type the exact value.</small>');
  shell.querySelector('.numberAfter').onclick = () => nudgeInlineNumber(input, 1);
  shell.querySelector('.numberBefore').onclick = () => nudgeInlineNumber(input, -1);
  shell.querySelectorAll('.numberNudge').forEach(control => control.onkeydown = event => {
    if (!['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    control.click();
  });
  let startY = null;
  shell.addEventListener('pointerdown', event => { if (event.target === input) return; startY = event.clientY; });
  shell.addEventListener('pointerup', event => {
    if (startY == null || event.target === input) { startY = null; return; }
    const distance = startY - event.clientY;
    if (Math.abs(distance) > 18) nudgeInlineNumber(input, distance > 0 ? 1 : -1, Math.max(1, Math.round(Math.abs(distance) / 35)));
    startY = null;
  });
  shell.addEventListener('wheel', event => {
    event.preventDefault();
    nudgeInlineNumber(input, event.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  input.addEventListener('input', () => updateInlineNumber(input));
  updateInlineNumber(input);
}

function syncInlineOptionWheel(select, scroll = true) {
  const rail = select.parentElement?.querySelector(':scope > .inlineOptionRail');
  if (!rail) return;
  rail.classList.toggle('disabled', select.disabled);
  const index = Math.max(0, select.selectedIndex);
  rail.querySelectorAll('.inlineOptionItem').forEach((item, itemIndex) => {
    item.classList.toggle('active', itemIndex === index);
    item.setAttribute('aria-selected', itemIndex === index ? 'true' : 'false');
  });
  if (scroll) requestAnimationFrame(() => rail.scrollTo({ top: index * 48, behavior: 'smooth' }));
}

function buildInlineOptionWheel(select) {
  select.parentElement?.querySelector(':scope > .inlineOptionRail')?.remove();
  const rail = document.createElement('div');
  rail.className = 'inlineOptionRail';
  rail.tabIndex = 0;
  rail.setAttribute('role', 'listbox');
  rail.setAttribute('aria-label', select.getAttribute('aria-label') || 'Choose an option');
  rail.innerHTML = [...select.options].map((option, index) => `<button type="button" class="inlineOptionItem${index === select.selectedIndex ? ' active' : ''}" data-option-index="${index}" role="option" aria-selected="${index === select.selectedIndex}">${esc(option.textContent)}</button>`).join('');
  select.insertAdjacentElement('afterend', rail);
  const choose = (index, userInitiated = true) => {
    if (select.disabled) return;
    const bounded = Math.max(0, Math.min(select.options.length - 1, index));
    if (select.selectedIndex !== bounded) {
      select.selectedIndex = bounded;
      if (userInitiated) {
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        haptic();
      }
    }
    syncInlineOptionWheel(select, false);
    queueMicrotask(() => syncAllInlineControls());
  };
  rail.onclick = event => {
    const item = event.target.closest('.inlineOptionItem');
    if (!item) return;
    const index = Number(item.dataset.optionIndex);
    choose(index);
    rail.scrollTo({ top: index * 48, behavior: 'smooth' });
  };
  let settleTimer;
  rail.addEventListener('scroll', () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => choose(Math.round(rail.scrollTop / 48)), 90);
  }, { passive: true });
  rail.onkeydown = event => {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    choose(select.selectedIndex + (event.key === 'ArrowDown' ? 1 : -1));
    syncInlineOptionWheel(select);
  };
  requestAnimationFrame(() => {
    rail.scrollTop = Math.max(0, select.selectedIndex) * 48;
    syncInlineOptionWheel(select, false);
  });
}

function enhanceSelect(select) {
  if (select.dataset.inlineWheelReady) return;
  select.dataset.inlineWheelReady = 'true';
  select.classList.add('inlineSelectSource');
  buildInlineOptionWheel(select);
  select.addEventListener('change', () => syncInlineOptionWheel(select));
  new MutationObserver(() => buildInlineOptionWheel(select)).observe(select, { childList: true, subtree: true });
  setTimeout(() => syncInlineOptionWheel(select), 0);
}

function prepareInlineControls(root = document) {
  const numbers = [...(root.matches?.('input[type="number"]') ? [root] : []), ...(root.querySelectorAll?.('input[type="number"]') || [])];
  const selects = [...(root.matches?.('select') ? [root] : []), ...(root.querySelectorAll?.('select') || [])];
  numbers.forEach(enhanceNumberInput);
  selects.forEach(enhanceSelect);
}

function syncAllInlineControls(root = document) {
  root.querySelectorAll?.('input[type="number"]').forEach(updateInlineNumber);
  root.querySelectorAll?.('select').forEach(select => syncInlineOptionWheel(select, !!select.closest('.flowStep.active')));
}

function flowStepIsAvailable(step) {
  return [...step.children].some(child => !child.matches('.flowStepHead, .flowActions') && !child.classList.contains('hidden'));
}

function showFormStep(form, requestedIndex) {
  const available = [...form.querySelectorAll(':scope > .flowStep')].filter(flowStepIsAvailable);
  if (!available.length) return;
  const index = Math.max(0, Math.min(available.length - 1, requestedIndex));
  form.dataset.flowIndex = String(index);
  form.querySelectorAll(':scope > .flowStep').forEach(step => step.classList.toggle('active', step === available[index]));
  available.forEach((step, stepIndex) => {
    const head = step.querySelector(':scope > .flowStepHead');
    const label = step.querySelector('label');
    const title = step.dataset.flowTitle || label?.dataset.fieldLabel || label?.childNodes[0]?.textContent?.trim() || 'Next detail';
    if (head) head.innerHTML = `<span>Step ${stepIndex + 1} of ${available.length}</span><b>${esc(title)}</b><i style="--flow-progress:${(stepIndex + 1) / available.length * 100}%"></i>`;
  });
  requestAnimationFrame(() => {
    syncAllInlineControls(available[index]);
    available[index].querySelector('input:not([type="hidden"]), textarea, .inlineOptionRail')?.focus({ preventScroll: true });
  });
}

function validateFlowStep(step) {
  const controls = [...step.querySelectorAll('input, select, textarea')].filter(control => !control.disabled && !control.closest('.hidden'));
  for (const control of controls) {
    if (control.checkValidity()) continue;
    control.reportValidity();
    return false;
  }
  return true;
}

function setupFormFlow(form) {
  if (form.dataset.flowReady) return;
  form.dataset.flowReady = 'true';
  let steps = [...form.querySelectorAll(':scope > .flowStep')];
  const submit = [...form.children].find(child => child.matches?.('button[type="submit"]'));
  if (!steps.length) {
    const children = [...form.children].filter(child => child !== submit);
    let pendingNotes = [];
    children.forEach(child => {
      if (child.matches('.friendlyNote, .warningNote') && !child.querySelector('input,select,textarea')) { pendingNotes.push(child); return; }
      const step = document.createElement('section');
      step.className = 'flowStep';
      pendingNotes.forEach(note => step.appendChild(note));
      pendingNotes = [];
      step.appendChild(child);
      form.appendChild(step);
      steps.push(step);
    });
    if (pendingNotes.length && steps.length) pendingNotes.forEach(note => steps[0].prepend(note));
    if (submit && steps.length) steps.at(-1).appendChild(submit);
  }
  if (steps.length < 2) { steps[0]?.classList.add('active'); return; }
  steps.forEach((step, index) => {
    step.insertAdjacentHTML('afterbegin', '<div class="flowStepHead"></div>');
    const actions = document.createElement('div');
    actions.className = 'flowActions';
    if (index > 0) actions.innerHTML += '<button type="button" class="flowBack">Back</button>';
    if (index < steps.length - 1) actions.innerHTML += '<button type="button" class="primary flowNext">Continue</button>';
    step.appendChild(actions);
    actions.querySelector('.flowBack')?.addEventListener('click', () => showFormStep(form, Number(form.dataset.flowIndex || 0) - 1));
    actions.querySelector('.flowNext')?.addEventListener('click', () => {
      if (validateFlowStep(step)) showFormStep(form, Number(form.dataset.flowIndex || 0) + 1);
    });
  });
  form.addEventListener('submit', event => {
    const available = [...form.querySelectorAll(':scope > .flowStep')].filter(flowStepIsAvailable);
    const index = Number(form.dataset.flowIndex || 0);
    if (index >= available.length - 1) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (validateFlowStep(available[index])) showFormStep(form, index + 1);
  }, true);
  showFormStep(form, 0);
}

async function runOperation(operation) {
  if (operation.action === 'delete') {
    return db.from(operation.table).delete().eq('id', operation.id).eq('household_id', householdId);
  }
  if (operation.action === 'budget') {
    return db.from('budgets').upsert(operation.rows, { onConflict: 'household_id,category' });
  }
  if (operation.action === 'snapshot') {
    return db.from('net_worth_snapshots').upsert(operation.row, { onConflict: 'household_id,snapshot_date' });
  }
  if (operation.action === 'settings') {
    return db.from('household_settings').upsert(operation.row, { onConflict: 'household_id' });
  }
  if (operation.action === 'checkup') {
    return db.from('monthly_checkups').upsert(operation.row, { onConflict: 'household_id,month' });
  }
  if (operation.action === 'moneyDate') {
    return db.from('weekly_money_dates').upsert(operation.row, { onConflict: 'household_id,week_start' });
  }
  return db.from(operation.table).upsert(operation.row);
}

async function flushPending() {
  if (!db || !householdId || !navigator.onLine) return false;
  let items = pending();
  if (!items.length) { updateSyncStatus(); return true; }
  updateSyncStatus('Syncing saved changes…');
  while (items.length) {
    const operation = items[0];
    try {
      const { error } = await runOperation(operation);
      if (error) throw error;
      items.shift();
      savePending(items);
    } catch (error) {
      if (error?.code === '23505' && operation.row?.recurring_item_id) {
        items.shift();
        savePending(items);
        toast('This recurring item was already confirmed this month.');
        continue;
      }
      updateSyncStatus(`${items.length} change${items.length === 1 ? '' : 's'} waiting · ${error?.message || 'offline'}`);
      return false;
    }
  }
  updateSyncStatus();
  return true;
}

async function saveOperation(operation, options = {}) {
  enqueue(operation);
  cache();
  render();
  if (options.close !== false) closeModal();
  if (options.message) toast(options.message);
  if (options.celebrate) celebrate();
  haptic();
  if (await flushPending()) await loadRemote();
}

async function saveOperations(operations, options = {}) {
  operations.forEach(enqueue);
  cache();
  render();
  if (options.close !== false) closeModal();
  if (options.message) toast(options.message);
  if (options.celebrate) celebrate();
  haptic();
  if (await flushPending()) await loadRemote();
}

window.addEventListener('online', async () => {
  if (await flushPending()) await loadRemote();
});

function showPage(name) {
  currentPage = name;
  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  $(`page-${name}`)?.classList.remove('hidden');
  document.querySelectorAll('.bottomNav button').forEach(button => button.classList.toggle('active', button.dataset.page === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  render();
  if (name === 'money') refreshPrices(false);
}

async function boot() {
  const config = window.SUPABASE_CONFIG || {};
  if (!config.url || !config.anonKey) {
    $('authMessage').textContent = 'Supabase configuration is missing.';
    return;
  }
  db = window.supabase.createClient(config.url, config.anonKey);
  const { data: { session } } = await db.auth.getSession();
  if (session) await signedIn(session.user);
  else showAuth();
  db.auth.onAuthStateChange((_event, nextSession) => {
    setTimeout(() => {
      if (nextSession) signedIn(nextSession.user);
      else showAuth();
    }, 0);
  });
}

function showAuth() {
  if (realtimeChannel && db) db.removeChannel(realtimeChannel);
  currentUser = null;
  householdId = null;
  stateKey = '';
  pendingKey = '';
  state = clone(DEFAULT);
  $('authScreen').classList.remove('hidden');
  $('app').classList.add('hidden');
}

$('authForm').onsubmit = async event => {
  event.preventDefault();
  $('authMessage').textContent = 'Signing in…';
  const { error } = await db.auth.signInWithPassword({ email: $('authEmail').value, password: $('authPassword').value });
  $('authMessage').textContent = error ? error.message : '';
};

async function signedIn(user) {
  if (currentUser?.id === user.id && householdId) return;
  currentUser = user;
  $('authScreen').classList.add('hidden');
  $('app').classList.remove('hidden');
  updateSyncStatus('Finding your household…');
  const { data: member, error } = await db.from('household_members')
    .select('household_id,display_name,role').eq('user_id', user.id).limit(1).maybeSingle();
  if (error || !member) {
    updateSyncStatus('Household not found');
    toast('This login is not attached to a household.');
    return;
  }
  householdId = member.household_id;
  loadScopedState();
  state.member = { displayName: member.display_name || 'Friend', role: member.role || 'member' };
  cache();
  await flushPending();
  await loadRemote();
  subscribeRealtime();
  showPage(currentPage);
  await refreshPrices(false);
  await ensureTodaySnapshot();
  handleQuickAction();
}

async function loadRemote() {
  if (!db || !householdId) return;
  const results = await Promise.all([
    db.from('transactions').select('*').eq('household_id', householdId),
    db.from('budgets').select('*').eq('household_id', householdId),
    db.from('goals').select('*').eq('household_id', householdId),
    db.from('debts').select('*').eq('household_id', householdId),
    db.from('assets').select('*').eq('household_id', householdId),
    db.from('accounts').select('*').eq('household_id', householdId),
    db.from('recurring_items').select('*').eq('household_id', householdId),
    db.from('goal_contributions').select('*').eq('household_id', householdId),
    db.from('net_worth_snapshots').select('*').eq('household_id', householdId).order('snapshot_date'),
    db.from('monthly_checkups').select('*').eq('household_id', householdId).order('month'),
    db.from('sinking_funds').select('*').eq('household_id', householdId).order('due_date'),
    db.from('weekly_money_dates').select('*').eq('household_id', householdId).order('week_start'),
    db.from('household_settings').select('*').eq('household_id', householdId).maybeSingle(),
    db.from('household_members').select('display_name').eq('household_id', householdId)
  ]);
  if (results.some(result => result.error)) {
    updateSyncStatus('Could not refresh · saved data kept');
    return;
  }
  if (pending().length) { updateSyncStatus(); return; }
  const [transactions, budgets, goals, debts, assets, accounts, recurring, contributions, snapshots, checkups, sinkingFunds, weeklyReviews, settings, members] = results.map(r => r.data);
  state.people = members.map(member => member.display_name).filter(Boolean);
  state.transactions = transactions.map(row => ({
    id: row.id, type: row.type, amount: +row.amount, currency: cleanCurrency(row.currency), category: row.category,
    paidBy: row.paid_by, accountId: row.account_id || '', account: row.account || '', toAccountId: row.to_account_id || '',
    toAmount: row.to_amount == null ? null : +row.to_amount, debtId: row.debt_id || '',
    debtPrincipal: row.debt_principal == null ? null : +row.debt_principal,
    debtInterest: row.debt_interest == null ? 0 : +row.debt_interest,
    recurringItemId: row.recurring_item_id || '', recurringMonth: row.recurring_month || '',
    date: row.date, note: row.note || '', createdAt: row.created_at || '', updatedAt: row.updated_at || ''
  }));
  state.budgets = Object.fromEntries(budgets.map(row => [row.category, { amount: +row.amount, currency: cleanCurrency(row.currency) }]));
  state.goals = goals.map(row => ({ id: row.id, name: row.name, target: +row.target, saved: +row.saved, currency: cleanCurrency(row.currency), due: row.due_date || '', active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.debts = debts.map(row => ({ id: row.id, name: row.name, original: +row.original_amount, remaining: +row.remaining_amount, currency: cleanCurrency(row.currency), due: row.due_date || '', apr: +(row.annual_interest_rate || 0), minimum: +(row.minimum_payment || 0), paymentDay: row.payment_day || null, active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.assets = assets.map(row => ({ id: row.id, name: row.name, type: row.asset_type, symbol: row.symbol || '', quantity: +row.quantity, currency: cleanCurrency(row.currency), manualValue: row.manual_value == null ? null : +row.manual_value, notes: row.notes || '', createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.accounts = accounts.map(row => ({ id: row.id, name: row.name, type: row.account_type, currency: cleanCurrency(row.currency), openingBalance: +row.opening_balance, openingDate: row.opening_date, notes: row.notes || '', active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.recurring = recurring.map(row => ({ id: row.id, name: row.name, kind: row.kind, amount: +row.amount, currency: cleanCurrency(row.currency), category: row.category, paidBy: row.paid_by, accountId: row.account_id || '', day: row.day_of_month, note: row.note || '', active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.contributions = contributions.map(row => ({ id: row.id, goalId: row.goal_id, accountId: row.account_id || '', amount: +row.amount, currency: cleanCurrency(row.currency), date: row.date, note: row.note || '', createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.snapshots = snapshots.map(row => ({ id: row.id, date: row.snapshot_date, cashUSD: +row.cash_usd, assetsUSD: +row.assets_usd, debtUSD: +row.debt_usd, netWorthUSD: +row.net_worth_usd }));
  state.checkups = checkups.map(row => ({ id: row.id, month: row.month, accountCount: +row.account_count, adjustmentUSD: +row.adjustment_total_usd, note: row.note || '', focus: row.focus || '', closedAt: row.closed_at || '', balancesCheckedAt: row.balances_checked_at || '', completedBy: row.completed_by || '', completedAt: row.completed_at || '', updatedAt: row.updated_at || '' }));
  state.sinkingFunds = sinkingFunds.map(row => ({ id: row.id, name: row.name, target: +row.target_amount, saved: +row.saved_amount, currency: cleanCurrency(row.currency), due: row.due_date || '', lastReservedMonth: row.last_reserved_month || '', note: row.note || '', active: row.active !== false, createdAt: row.created_at || '', updatedAt: row.updated_at || '' }));
  state.weeklyReviews = weeklyReviews.map(row => ({ id: row.id, weekStart: row.week_start, reviewedBy: row.reviewed_by || '', win: row.win || '', nextAction: row.next_action || '', completedAt: row.completed_at || '', updatedAt: row.updated_at || '' }));
  if (settings) {
    state.settings.base = cleanCurrency(settings.base_currency) || state.settings.base;
    state.settings.paydayDay = settings.payday_day || null;
    state.settings.funMode = settings.fun_mode !== false;
    state.settings.debtStrategy = ['avalanche', 'snowball'].includes(settings.debt_strategy) ? settings.debt_strategy : 'avalanche';
    state.settings.rates = {
      USD: 1,
      AED: +(settings.usd_to_aed || state.settings.rates.AED),
      MVR: +(settings.usd_to_mvr || state.settings.rates.MVR),
      INR: +(settings.usd_to_inr || state.settings.rates.INR)
    };
  }
  cache();
  render();
  updateSyncStatus();
}

function scheduleRemoteReload() {
  if (pending().length) return;
  clearTimeout(realtimeTimer);
  realtimeTimer = setTimeout(() => loadRemote(), 350);
}

function subscribeRealtime() {
  if (realtimeChannel) db.removeChannel(realtimeChannel);
  realtimeChannel = db.channel(`household-v9-${householdId}`);
  for (const table of ['transactions', 'budgets', 'goals', 'debts', 'assets', 'accounts', 'recurring_items', 'goal_contributions', 'net_worth_snapshots', 'monthly_checkups', 'sinking_funds', 'weekly_money_dates', 'household_settings']) {
    realtimeChannel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `household_id=eq.${householdId}` }, scheduleRemoteReload);
  }
  realtimeChannel.subscribe(status => {
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') updateSyncStatus('Realtime reconnecting…');
  });
}

function handleQuickAction() {
  if (!pendingQuickAction) return;
  const action = pendingQuickAction;
  pendingQuickAction = '';
  history.replaceState({}, '', `${location.pathname}${location.hash || ''}`);
  if (action === 'expense') openQuickExpense();
  else if (action === 'income') openQuickIncome({ category: 'Salary' });
  else if (action === 'transfer') openTransfer();
}

function accountDeltaNative(account, transaction) {
  if (transaction.type === 'transfer') {
    if (transaction.accountId === account.id) return -Number(transaction.amount || 0);
    if (transaction.toAccountId === account.id) return Number(transaction.toAmount || 0);
    return 0;
  }
  if (transaction.accountId !== account.id) return 0;
  return (transaction.type === 'income' ? 1 : -1) * Number(transaction.amount || 0);
}

function accountBalanceNative(account) {
  return Number(account.openingBalance || 0) + state.transactions
    .filter(transaction => transaction.date >= (account.openingDate || '0000-00-00'))
    .reduce((sum, transaction) => sum + accountDeltaNative(account, transaction), 0);
}
function accountBalanceUSD(account) { return usd(accountBalanceNative(account), account.currency); }
function accountTypeLabel(type) { return type === 'bank' ? 'Bank account' : type === 'cash' ? 'Cash' : 'Mobile wallet'; }

function assetUSD(asset) {
  if (asset.type === 'cash') return usd(asset.quantity, asset.currency);
  if (asset.type === 'manual') return usd(asset.manualValue || 0, asset.currency);
  const price = state.prices[asset.symbol]?.usd;
  if (!price) return 0;
  if (asset.type === 'metal') return (Number(asset.quantity) / 31.1034768) * price;
  if (asset.type === 'crypto') return Number(asset.quantity) * price;
  return 0;
}

function marketLabel(asset) {
  if (asset.type === 'metal') return `${Number(asset.quantity).toLocaleString()} g · ${asset.symbol}`;
  if (asset.type === 'crypto') return `${Number(asset.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${asset.symbol}`;
  if (asset.type === 'cash') return money(asset.quantity, asset.currency);
  return money(asset.manualValue || 0, asset.currency);
}

function monthTransactions() {
  const currentMonth = monthKey();
  return state.transactions.filter(transaction =>
    transaction.date.startsWith(currentMonth) &&
    transaction.type !== 'transfer' &&
    transaction.category !== 'Balance adjustment'
  );
}

function moneyMetrics() {
  const monthTx = monthTransactions();
  const incomeUSD = monthTx.filter(t => t.type === 'income').reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
  const spentUSD = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
  const accountTotalUSD = activeAccounts().reduce((sum, account) => sum + accountBalanceUSD(account), 0);
  const unassignedCashUSD = state.transactions
    .filter(t => !t.accountId && t.type !== 'transfer')
    .reduce((sum, t) => sum + (t.type === 'income' ? 1 : -1) * usd(t.amount, t.currency), 0);
  const cashUSD = accountTotalUSD + unassignedCashUSD;
  const assetsUSD = state.assets.reduce((sum, asset) => sum + assetUSD(asset), 0);
  const debtUSD = state.debts.reduce((sum, debt) => sum + usd(debt.remaining, debt.currency), 0);
  const goalSavedUSD = activeGoals().reduce((sum, goal) => sum + usd(goal.saved, goal.currency), 0);
  const goalTargetUSD = activeGoals().reduce((sum, goal) => sum + usd(goal.target, goal.currency), 0);
  const sinkingSavedUSD = state.sinkingFunds.filter(fund => fund.active !== false).reduce((sum, fund) => sum + usd(fund.saved, fund.currency), 0);
  const sinkingTargetUSD = state.sinkingFunds.filter(fund => fund.active !== false).reduce((sum, fund) => sum + usd(fund.target, fund.currency), 0);
  const budgetUSD = Object.values(state.budgets).reduce((sum, budget) => sum + usd(budget.amount, budget.currency), 0);
  return {
    monthTx, incomeUSD, spentUSD, accountTotalUSD, unassignedCashUSD, cashUSD, assetsUSD, debtUSD,
    goalSavedUSD, goalTargetUSD, sinkingSavedUSD, sinkingTargetUSD, budgetUSD, surplusUSD: incomeUSD - spentUSD,
    spendableUSD: cashUSD - goalSavedUSD - sinkingSavedUSD, netWorthUSD: cashUSD + assetsUSD - debtUSD
  };
}

function allocationBuckets(metrics = moneyMetrics()) {
  const expenseFor = categories => metrics.monthTx
    .filter(t => t.type === 'expense' && categories.includes(t.category))
    .reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
  const futureContributionsUSD = state.contributions
    .filter(c => c.date.startsWith(monthKey()))
    .reduce((sum, c) => sum + usd(c.amount, c.currency), 0);
  const sinkingContributionsUSD = state.sinkingFunds
    .filter(fund => fund.lastReservedMonth === monthStart())
    .reduce((sum, fund) => sum + Math.min(sinkingMonthlyNeedUSD(fund), usd(fund.saved, fund.currency)), 0);
  return [
    { key: 'essential', label: 'Essentials', pct: 40, target: metrics.incomeUSD * .4, actual: expenseFor(ESSENTIAL_CATEGORIES) },
    { key: 'debt', label: 'Debt freedom', pct: 30, target: metrics.incomeUSD * .3, actual: expenseFor(['Debt']) },
    { key: 'future', label: 'Future', pct: 20, target: metrics.incomeUSD * .2, actual: expenseFor(['Savings']) + futureContributionsUSD + sinkingContributionsUSD },
    { key: 'wants', label: 'Fun & wants', pct: 10, target: metrics.incomeUSD * .1, actual: expenseFor(WANT_CATEGORIES) }
  ];
}

function nextPaydayInfo() {
  const day = Number(state.settings.paydayDay);
  if (!(day >= 1 && day <= 31)) return null;
  const now = new Date(`${today()}T12:00:00`);
  const makePayday = (year, month) => {
    const last = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, last), 12);
  };
  let date = makePayday(now.getFullYear(), now.getMonth());
  if (date < now) date = makePayday(now.getFullYear(), now.getMonth() + 1);
  const days = Math.max(1, Math.round((date - now) / 86400000) + 1);
  return { date: localDate(date), days };
}

function dateObject(value) { return new Date(`${value}T12:00:00`); }
function addDays(value, days) {
  const date = dateObject(value);
  date.setDate(date.getDate() + days);
  return localDate(date);
}
function weekStart(value = today()) {
  const date = dateObject(value);
  const day = date.getDay();
  date.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
  return localDate(date);
}
function addMonths(value, months) {
  const date = dateObject(value.length === 7 ? `${value}-01` : value);
  date.setMonth(date.getMonth() + months);
  return localDate(date);
}
function monthsUntil(value) {
  if (!value || value <= today()) return 1;
  const now = dateObject(monthStart());
  const due = dateObject(`${monthKey(value)}-01`);
  return Math.max(1, (due.getFullYear() - now.getFullYear()) * 12 + due.getMonth() - now.getMonth() + 1);
}
function sinkingMonthlyNeedUSD(fund) {
  return usd(Math.max(0, fund.target - fund.saved), fund.currency) / monthsUntil(fund.due);
}
function dateDistance(start, end) { return Math.max(0, Math.round((dateObject(end) - dateObject(start)) / 86400000)); }
function monthDatesBetween(start, end) {
  const values = [];
  const cursor = dateObject(`${monthKey(start)}-01`);
  const last = dateObject(`${monthKey(end)}-01`);
  while (cursor <= last) {
    values.push(localDate(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return values;
}
function monthlyDate(month, day) {
  const base = dateObject(month);
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  return `${monthKey(month)}-${String(Math.min(Number(day) || 1, lastDay)).padStart(2, '0')}`;
}
function recurringConfirmed(itemId, occurrenceDate) {
  return state.transactions.some(transaction =>
    transaction.recurringItemId === itemId && transaction.recurringMonth === monthStart(occurrenceDate)
  );
}
function recurringOccurrences(start, end, predicate = () => true) {
  const occurrences = [];
  for (const month of monthDatesBetween(start, end)) {
    state.recurring.filter(item => item.active !== false && predicate(item)).forEach(item => {
      const date = monthlyDate(month, item.day);
      if (date >= start && date <= end && !recurringConfirmed(item.id, date)) occurrences.push({ item, date });
    });
  }
  return occurrences;
}
function debtPaidInMonthUSD(debt, month) {
  return state.transactions.filter(transaction => transaction.debtId === debt.id && transaction.date.startsWith(monthKey(month)))
    .reduce((sum, transaction) => sum + usd(Number(transaction.debtPrincipal || 0) + Number(transaction.debtInterest || 0), debt.currency), 0);
}
function upcomingObligations(start, end) {
  const expenseOccurrences = recurringOccurrences(start, end, item => item.kind === 'expense');
  const billsUSD = expenseOccurrences.filter(({ item }) => item.category !== 'Debt')
    .reduce((sum, { item }) => sum + usd(item.amount, item.currency), 0);
  let debtUSD = 0;
  for (const month of monthDatesBetween(start, end)) {
    const monthEnd = monthlyDate(month, 31);
    const rangeStart = monthKey(month) === monthKey(start) ? start : month;
    const rangeEnd = monthKey(month) === monthKey(end) ? end : monthEnd;
    const recurringDebtUSD = expenseOccurrences
      .filter(({ item, date }) => item.category === 'Debt' && date >= rangeStart && date <= rangeEnd)
      .reduce((sum, { item }) => sum + usd(item.amount, item.currency), 0);
    const minimumDebtUSD = activeDebts().reduce((sum, debt) => {
      if (!(debt.minimum > 0)) return sum;
      const dueDate = debt.paymentDay ? monthlyDate(month, debt.paymentDay) : rangeEnd;
      if (dueDate < rangeStart || dueDate > rangeEnd) return sum;
      return sum + Math.max(0, usd(debt.minimum, debt.currency) - debtPaidInMonthUSD(debt, month));
    }, 0);
    debtUSD += Math.max(recurringDebtUSD, minimumDebtUSD);
  }
  return { billsUSD, debtUSD, totalUSD: billsUSD + debtUSD, occurrences: expenseOccurrences };
}

function safeSpendPlan(metrics = moneyMetrics(), buckets = allocationBuckets(metrics)) {
  const payday = nextPaydayInfo();
  if (!(metrics.incomeUSD > 0) || !payday) return { ready: false, dailyUSD: 0, weeklyUSD: 0, payday, protectedUSD: 0, bufferUSD: 0 };
  const wants = buckets.find(bucket => bucket.key === 'wants');
  const obligations = upcomingObligations(today(), payday.date);
  const sinkingUSD = activeSinkingFunds()
    .filter(fund => fund.lastReservedMonth !== monthStart())
    .reduce((sum, fund) => sum + sinkingMonthlyNeedUSD(fund), 0);
  const essentialsBudgetUSD = Object.entries(state.budgets)
    .filter(([category]) => ESSENTIAL_CATEGORIES.includes(category))
    .reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
  const daysThisMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const bufferUSD = essentialsBudgetUSD > 0 ? essentialsBudgetUSD / daysThisMonth * 3 : 0;
  const wantsRemainingUSD = Math.max(0, wants.target - wants.actual);
  const cashAfterProtectionUSD = Math.max(0, metrics.spendableUSD - obligations.totalUSD - sinkingUSD - bufferUSD);
  const remainingUSD = Math.min(wantsRemainingUSD, cashAfterProtectionUSD);
  const dailyUSD = remainingUSD / payday.days;
  return {
    ready: true, dailyUSD, weeklyUSD: dailyUSD * Math.min(7, payday.days), payday, remainingUSD,
    wantsRemainingUSD, protectedUSD: obligations.totalUSD + sinkingUSD, billsUSD: obligations.billsUSD,
    debtUSD: obligations.debtUSD, sinkingUSD, bufferUSD, spendableCashUSD: metrics.spendableUSD,
    shortfallUSD: Math.max(0, obligations.totalUSD + sinkingUSD + bufferUSD - metrics.spendableUSD)
  };
}

function openSafeBreakdown() {
  const metrics = moneyMetrics();
  const safe = safeSpendPlan(metrics, allocationBuckets(metrics));
  if (!safe.ready) {
    openModal('Safe-to-spend guide', `<div class="form"><div class="friendlyNote">Add this month’s salary and set the salary day first. The app then protects real cash, goals, upcoming bills, debt minimums and a three-day essentials buffer.</div><button class="primary" onclick="closeModal();openQuickIncome({category:'Salary'})">Add salary</button></div>`);
    return;
  }
  openModal('Safe-to-spend guide', `<div class="form">
    <div class="friendlyNote">This is the lower of your remaining 10% wants allowance and the cash that is genuinely free after protection.</div>
    <div class="statement">
      <div class="statementRow"><time>1</time><div><b>Spendable cash</b><div class="meta">Accounts minus money reserved for goals and sinking funds</div></div><div class="statementValue"><strong>${baseMoney(safe.spendableCashUSD)}</strong></div></div>
      <div class="statementRow"><time>2</time><div><b>Upcoming bills</b><div class="meta">Unconfirmed regular expenses before payday</div></div><div class="statementValue"><strong>− ${baseMoney(safe.billsUSD)}</strong></div></div>
      <div class="statementRow"><time>3</time><div><b>Debt minimums</b><div class="meta">Still due before payday</div></div><div class="statementValue"><strong>− ${baseMoney(safe.debtUSD)}</strong></div></div>
      <div class="statementRow"><time>4</time><div><b>Sinking funds</b><div class="meta">This month's set-asides not yet recorded</div></div><div class="statementValue"><strong>− ${baseMoney(safe.sinkingUSD)}</strong></div></div>
      <div class="statementRow"><time>5</time><div><b>Three-day buffer</b><div class="meta">Based on essential category limits</div></div><div class="statementValue"><strong>− ${baseMoney(safe.bufferUSD)}</strong></div></div>
      <div class="statementRow"><time>✓</time><div><b>Safe wants left</b><div class="meta">Never above the remaining 10% allowance</div></div><div class="statementValue"><strong>${baseMoney(safe.remainingUSD)}</strong></div></div>
    </div>
    ${safe.shortfallUSD > 0 ? `<div class="warningNote">Protected commitments exceed spendable cash by <b>${baseMoney(safe.shortfallUSD)}</b>. Pause non-essential spending and update any bill that has already been paid.</div>` : ''}
    <button class="primary" onclick="closeModal()">Got it</button>
  </div>`);
}

function setPriceRefreshUi(message, busy = false) {
  ['priceStatus', 'moneyRateStatus'].forEach(id => {
    const element = $(id);
    if (element) element.textContent = message;
  });
  const button = $('moneyRefreshRates');
  if (button) {
    button.disabled = busy;
    button.classList.toggle('isRefreshing', busy);
  }
  const label = $('moneyRefreshLabel');
  if (label) label.textContent = busy ? 'Refreshing…' : 'Refresh rates';
}

async function refreshPrices(force = false) {
  if (priceRefresh) return priceRefresh;
  priceRefresh = (async () => {
    const defaults = ['XAU', 'XAG', 'BTC', 'ETH'];
    const owned = state.assets.filter(a => ['metal', 'crypto'].includes(a.type)).map(a => a.symbol).filter(Boolean);
    const symbols = [...new Set([...defaults, ...owned])];
    setPriceRefreshUi('Refreshing free market rates…', true);
    await Promise.allSettled(symbols.map(async symbol => {
      const cached = state.prices[symbol];
      if (!force && cached && Date.now() - new Date(cached.updated).getTime() < 15 * 60 * 1000) return;
      try {
        const response = await fetch(`https://api.gold-api.com/price/${encodeURIComponent(symbol)}`, { cache: 'no-store' });
        if (!response.ok) return;
        const payload = await response.json();
        const price = Number(payload.price);
        if (Number.isFinite(price) && price > 0) {
          state.prices[symbol] = { usd: price, updated: payload.updatedAt || new Date().toISOString(), source: 'Gold API' };
        }
      } catch (_error) { /* Cached values remain available offline. */ }
    }));
    cache();
    render();
    const newest = Object.values(state.prices).map(p => new Date(p.updated).getTime()).filter(Number.isFinite).sort((a, b) => b - a)[0];
    const stale = newest && Date.now() - newest > 60 * 60 * 1000;
    setPriceRefreshUi(newest
      ? `${stale ? 'Last saved rates' : 'Live rates updated'} · ${new Date(newest).toLocaleString()}`
      : 'Live rates unavailable · using saved values');
  })();
  try { return await priceRefresh; }
  finally {
    priceRefresh = null;
    const button = $('moneyRefreshRates');
    if (button) {
      button.disabled = false;
      button.classList.remove('isRefreshing');
    }
    const label = $('moneyRefreshLabel');
    if (label) label.textContent = 'Refresh rates';
  }
}

async function ensureTodaySnapshot() {
  if (!db || !householdId || pending().length) return;
  const missingMarketPrice = state.assets.some(a => ['metal', 'crypto'].includes(a.type) && !state.prices[a.symbol]?.usd);
  if (missingMarketPrice) return;
  const metrics = moneyMetrics();
  const existing = state.snapshots.find(snapshot => snapshot.date === today());
  if (existing && Math.abs(existing.netWorthUSD - metrics.netWorthUSD) < .005 &&
      Math.abs(existing.cashUSD - metrics.cashUSD) < .005 && Math.abs(existing.debtUSD - metrics.debtUSD) < .005) return;
  const row = {
    household_id: householdId, snapshot_date: today(), cash_usd: metrics.cashUSD,
    assets_usd: metrics.assetsUSD, debt_usd: metrics.debtUSD, net_worth_usd: metrics.netWorthUSD
  };
  const { error } = await runOperation({ action: 'snapshot', row });
  if (!error) {
    const local = { id: existing?.id || crypto.randomUUID(), date: today(), cashUSD: metrics.cashUSD, assetsUSD: metrics.assetsUSD, debtUSD: metrics.debtUSD, netWorthUSD: metrics.netWorthUSD };
    const index = state.snapshots.findIndex(snapshot => snapshot.date === today());
    if (index >= 0) state.snapshots[index] = local;
    else state.snapshots.push(local);
    cache();
    render();
  }
}

function txIcon(transaction) {
  if (transaction.type === 'transfer') return '⇄';
  if (transaction.debtId) return '🧾';
  return EXPENSE_CATEGORIES.find(([category]) => category === transaction.category)?.[1] || (transaction.type === 'income' ? '↑' : '•');
}

function transactionHtml(transaction, actions = false) {
  const source = accountName(transaction.accountId) || transaction.account;
  const destination = accountName(transaction.toAccountId);
  const accountLine = transaction.type === 'transfer'
    ? `${source || 'Account'} → ${destination || 'Account'}`
    : source ? source : 'Not linked to an account';
  const amount = transaction.type === 'transfer'
    ? `${money(transaction.amount, transaction.currency)} → ${money(transaction.toAmount, state.accounts.find(a => a.id === transaction.toAccountId)?.currency || transaction.currency)}`
    : `${transaction.type === 'income' ? '+' : '−'} ${money(transaction.amount, transaction.currency)}`;
  return `<div class="tx ${transaction.type}">
    <div class="txLeft"><div class="txIcon">${txIcon(transaction)}</div><div class="txMain">
      <div class="txName">${esc(transaction.category)}</div>
      <div class="meta">${esc(transaction.date)} · ${esc(accountLine)}${transaction.note ? ` · ${esc(transaction.note)}` : ''}</div>
      ${actions ? `<div class="cardActions"><button class="linkBtn" onclick="editTransaction('${transaction.id}')">Edit</button><button class="dangerLink" onclick="deleteTransaction('${transaction.id}')">Delete</button></div>` : ''}
    </div></div><div class="txAmount ${transaction.type}">${amount}</div>
  </div>`;
}

function actualChartHtml(metrics) {
  const pointsData = [...state.snapshots].sort((a, b) => a.date.localeCompare(b.date));
  if (!pointsData.length) return '<div class="emptyChart"><b>Your honest starting point begins today</b><span>The app will save one net-worth point per day automatically.</span></div>';
  const values = pointsData.map(point => point.netWorthUSD);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const range = Math.max(1, high - low);
  const count = Math.max(1, pointsData.length - 1);
  const coords = pointsData.map((point, index) => ({ x: 42 + index * (556 / count), y: 164 - ((point.netWorthUSD - low) / range) * 118 }));
  if (coords.length === 1) coords[0].x = 320;
  const points = coords.map(point => `${point.x},${point.y}`).join(' ');
  const areaPoints = coords.length === 1 ? `42,164 320,${coords[0].y} 598,164` : `42,164 ${points} 598,164`;
  const zeroY = 164 - ((0 - low) / range) * 118;
  return `<div class="chartLabels"><div><span>First point · ${formatDate(pointsData[0].date, { day: 'numeric', month: 'short' })}</span><b>${baseMoney(pointsData[0].netWorthUSD)}</b></div><div><span>Today</span><b>${baseMoney(metrics.netWorthUSD)}</b></div></div>
    <svg class="wealthSvg" viewBox="0 0 640 195" role="img" aria-label="Actual household net worth history">
      <defs><linearGradient id="wealthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#31846c" stop-opacity=".28"/><stop offset="1" stop-color="#31846c" stop-opacity=".02"/></linearGradient></defs>
      <line x1="42" y1="${zeroY}" x2="598" y2="${zeroY}" class="chartZero"/>
      <polygon points="${areaPoints}" class="chartArea"/>
      ${coords.length > 1 ? `<polyline points="${points}" class="chartLine"/>` : ''}
      ${coords.map(point => `<circle cx="${point.x}" cy="${point.y}" r="5" class="chartPoint"/>`).join('')}
      <text x="42" y="188">${esc(pointsData[0].date.slice(5))}</text><text x="598" y="188" text-anchor="end">${esc(pointsData.at(-1).date.slice(5))}</text>
    </svg><div class="chartFoot">Actual values use your entered account balances, assets, market prices and debt.</div>`;
}

function projectionChartHtml(metrics) {
  const recurringIncomeUSD = state.recurring.filter(item => item.active !== false && item.kind === 'income')
    .reduce((sum, item) => sum + usd(item.amount, item.currency), 0);
  const monthlyIncomeUSD = recurringIncomeUSD || metrics.incomeUSD;
  if (!(monthlyIncomeUSD > 0)) return '<div class="emptyChart"><b>Add salary to see a one-year direction</b><span>The projection will use your regular income, bills, debt interest and current 40–30–20–10 plan.</span></div>';
  const recurringLivingUSD = state.recurring.filter(item => item.active !== false && item.kind === 'expense' && !['Debt', 'Savings'].includes(item.category))
    .reduce((sum, item) => sum + usd(item.amount, item.currency), 0);
  const monthlyInterestUSD = activeDebts().reduce((sum, debt) => sum + usd(debt.remaining, debt.currency) * Number(debt.apr || 0) / 1200, 0);
  const scenarios = [
    { key: 'cautious', label: 'Cautious', color: '#e96d5b', livingShare: .60 },
    { key: 'current', label: 'Current plan', color: '#557fa3', livingShare: .50 },
    { key: 'improved', label: 'Improved', color: '#31846c', livingShare: .45 }
  ].map(scenario => {
    const livingUSD = Math.max(recurringLivingUSD, monthlyIncomeUSD * scenario.livingShare);
    const monthlyGrowthUSD = monthlyIncomeUSD - livingUSD - monthlyInterestUSD;
    return { ...scenario, monthlyGrowthUSD, values: Array.from({ length: 13 }, (_, index) => metrics.netWorthUSD + monthlyGrowthUSD * index) };
  });
  const allValues = scenarios.flatMap(scenario => scenario.values);
  const low = Math.min(0, ...allValues);
  const high = Math.max(0, ...allValues);
  const range = Math.max(1, high - low);
  const zeroY = 164 - ((0 - low) / range) * 118;
  const current = scenarios.find(scenario => scenario.key === 'current');
  const lines = scenarios.map(scenario => {
    const coords = scenario.values.map((value, index) => ({ x: 42 + index * (556 / 12), y: 164 - ((value - low) / range) * 118 }));
    return `<polyline points="${coords.map(point => `${point.x},${point.y}`).join(' ')}" fill="none" stroke="${scenario.color}" stroke-width="${scenario.key === 'current' ? 5 : 3}" stroke-linecap="round" stroke-linejoin="round" opacity="${scenario.key === 'current' ? 1 : .82}"/>`;
  }).join('');
  return `<div class="chartLabels"><div><span>Now</span><b>${baseMoney(metrics.netWorthUSD)}</b></div><div><span>Current plan · 12 months</span><b>${baseMoney(current.values.at(-1))}</b></div></div>
    <svg class="wealthSvg" viewBox="0 0 640 195" role="img" aria-label="Projected household net worth for twelve months">
      <line x1="42" y1="${zeroY}" x2="598" y2="${zeroY}" class="chartZero"/>
      ${lines}
      <text x="42" y="188">NOW</text><text x="598" y="188" text-anchor="end">12 MONTHS</text>
    </svg><div class="forecastLegend">${scenarios.map(scenario => `<span><i style="background:${scenario.color}"></i>${scenario.label}</span>`).join('')}</div><div class="chartFoot">Uses regular income and bills, your debt interest and three spending paths. Market prices stay unchanged, so this is guidance—not a promise.</div>`;
}

function setWealthChart(mode) {
  wealthChartMode = mode;
  render();
}

function cashflowForecast(days = cashflowDays) {
  const start = today();
  const end = addDays(start, days);
  const events = recurringOccurrences(start, end).map(({ item, date }) => ({
    date, label: item.name, accountId: item.accountId,
    deltaUSD: (item.kind === 'income' ? 1 : -1) * usd(item.amount, item.currency),
    deltaNative: (item.kind === 'income' ? 1 : -1) * Number(item.amount), currency: item.currency,
    category: item.category
  }));
  for (const month of monthDatesBetween(start, end)) {
    const hasRecurringDebt = events.some(event => event.category === 'Debt' && event.date.startsWith(monthKey(month)));
    if (hasRecurringDebt) continue;
    activeDebts().filter(debt => debt.remaining > .005 && debt.minimum > 0).forEach(debt => {
      const date = debt.paymentDay ? monthlyDate(month, debt.paymentDay) : monthlyDate(month, 31);
      if (date < start || date > end) return;
      const remainingUSD = Math.max(0, usd(debt.minimum, debt.currency) - debtPaidInMonthUSD(debt, month));
      if (remainingUSD > .005) events.push({ date, label: `${debt.name} minimum`, accountId: '', deltaUSD: -remainingUSD, deltaNative: null, currency: debt.currency, category: 'Debt' });
    });
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  let balanceUSD = moneyMetrics().cashUSD;
  let eventIndex = 0;
  const points = [{ date: start, balanceUSD }];
  for (let offset = 1; offset <= days; offset += 1) {
    const date = addDays(start, offset);
    while (eventIndex < events.length && events[eventIndex].date <= date) {
      balanceUSD += events[eventIndex].deltaUSD;
      eventIndex += 1;
    }
    points.push({ date, balanceUSD });
  }
  const accountEnd = activeAccounts().map(account => {
    const delta = events.filter(event => event.accountId === account.id && event.currency === account.currency)
      .reduce((sum, event) => sum + Number(event.deltaNative || 0), 0);
    return { id: account.id, name: account.name, currency: account.currency, balance: accountBalanceNative(account) + delta };
  });
  const lowest = points.reduce((result, point) => point.balanceUSD < result.balanceUSD ? point : result, points[0]);
  return { start, end, days, events, points, accountEnd, startUSD: points[0]?.balanceUSD || 0, endUSD: points.at(-1)?.balanceUSD || 0, lowest };
}

function cashflowChartHtml(forecast) {
  if (!forecast.events.length) return '<div class="emptyChart"><b>Add regular salary and bills</b><span>Your 30–90 day outlook will then populate automatically.</span></div>';
  const values = forecast.points.map(point => point.balanceUSD);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const range = Math.max(1, high - low);
  const coords = forecast.points.map((point, index) => ({
    x: 42 + index * (556 / Math.max(1, forecast.points.length - 1)),
    y: 164 - ((point.balanceUSD - low) / range) * 118
  }));
  const points = coords.map(point => `${point.x},${point.y}`).join(' ');
  const zeroY = 164 - ((0 - low) / range) * 118;
  const danger = forecast.lowest.balanceUSD < 0;
  return `<div class="forecastSummary"><div><span>Today</span><b>${baseMoney(forecast.startUSD)}</b></div><div><span>Expected in ${forecast.days} days</span><b>${baseMoney(forecast.endUSD)}</b></div></div>
    <svg class="wealthSvg" viewBox="0 0 640 195" role="img" aria-label="Expected household cash for ${forecast.days} days">
      <defs><linearGradient id="cashflowFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${danger ? '#e96d5b' : '#557fa3'}" stop-opacity=".24"/><stop offset="1" stop-color="#557fa3" stop-opacity=".02"/></linearGradient></defs>
      <line x1="42" y1="${zeroY}" x2="598" y2="${zeroY}" class="chartZero"/>
      <polygon points="42,164 ${points} 598,164" class="forecastArea"/><polyline points="${points}" class="forecastLine${danger ? ' forecastDanger' : ''}"/>
      <text x="42" y="188">${esc(forecast.start.slice(5))}</text><text x="598" y="188" text-anchor="end">${esc(forecast.end.slice(5))}</text>
    </svg>
    <div class="chartFoot">Lowest expected balance: <b>${baseMoney(forecast.lowest.balanceUSD)}</b> on ${formatDate(forecast.lowest.date)}. Confirmed items disappear from this forecast.</div>
    <div class="forecastAccounts">${forecast.accountEnd.map(account => `<div><span>${esc(account.name)}</span><b>${money(account.balance, account.currency)}</b></div>`).join('')}</div>`;
}

function setCashflowDays(days) {
  cashflowDays = [30, 60, 90].includes(Number(days)) ? Number(days) : 30;
  render();
}

function buildSuggestions(metrics, buckets) {
  const suggestions = [];
  const essentialsBudgetUSD = Object.entries(state.budgets)
    .filter(([category]) => ESSENTIAL_CATEGORIES.includes(category))
    .reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
  if (!activeAccounts().length) {
    suggestions.push(['Add your real bank balance', 'Start with the amount currently in the bank. Salary and spending will then update it automatically.']);
  }
  if (!(metrics.incomeUSD > 0)) {
    suggestions.push(['Add this month’s salary', 'That unlocks your safe daily spending amount and exact 40–30–20–10 targets.']);
  }
  if (metrics.debtUSD > 0) {
    if (metrics.incomeUSD > 0) {
      const monthly = metrics.incomeUSD * .3;
      const target = debtPriority(activeDebts().filter(debt => debt.remaining > .005).map(debt => ({ ...debt, balanceUSD: usd(debt.remaining, debt.currency) })), state.settings.debtStrategy)[0];
      suggestions.push(['Give debt its 30%', `Aim for ${baseMoney(monthly)} this month${target ? ` and direct extra to ${target.name}` : ''}.`]);
    } else {
      suggestions.push(['Debt gets the next 30%', 'Once salary is entered, the Plan page will turn 30% into a simple payment amount.']);
    }
  }
  if (metrics.goalSavedUSD > metrics.cashUSD) {
    suggestions.push(['Check reserved savings', `Goals currently reserve ${baseMoney(metrics.goalSavedUSD - metrics.cashUSD)} more than tracked cash. Update an account balance or reduce the goal amount.`]);
  }
  const emergencyTargetUSD = essentialsBudgetUSD * 3;
  const emergencyGoal = activeGoals().find(goal => /emergency/i.test(goal.name));
  const emergencySavedUSD = emergencyGoal ? usd(emergencyGoal.saved, emergencyGoal.currency) : 0;
  if (emergencyTargetUSD > 0 && emergencySavedUSD < emergencyTargetUSD) {
    suggestions.push(['Build a 3-month safety cushion', `Based on essential limits, the first target is ${baseMoney(emergencyTargetUSD)}. Keep it in an accessible account.`]);
  }
  const wants = buckets.find(bucket => bucket.key === 'wants');
  if (metrics.incomeUSD > 0 && wants.actual > wants.target) {
    suggestions.push(['Pause fun spending briefly', `Wants are ${baseMoney(wants.actual - wants.target)} over the 10% guide this month.`]);
  }
  if (activeGoals().length) {
    const goal = activeGoals().find(item => item.saved < item.target);
    if (goal?.due) {
      const months = Math.max(1, Math.ceil((new Date(`${goal.due}T12:00:00`) - new Date(`${today()}T12:00:00`)) / (86400000 * 30.44)));
      const monthly = Math.max(0, goal.target - goal.saved) / months;
      suggestions.push([`Keep ${goal.name} moving`, `${money(monthly, goal.currency)} a month reaches the current target date, if the date and balance stay unchanged.`]);
    }
  }
  if (!suggestions.length) suggestions.push(['Keep the rhythm', 'Record spending, confirm recurring items and check your Money page together once a week.']);
  return suggestions.slice(0, 4);
}

function debtPriority(debts, strategy) {
  return [...debts].sort((a, b) => strategy === 'snowball'
    ? a.balanceUSD - b.balanceUSD || b.apr - a.apr
    : b.apr - a.apr || a.balanceUSD - b.balanceUSD
  );
}

function simulateDebtPlan(incomeUSD, extraUSD = 0, strategy = state.settings.debtStrategy) {
  const debts = activeDebts().filter(debt => debt.remaining > .005).map(debt => ({
    id: debt.id, name: debt.name, currency: debt.currency, apr: Number(debt.apr || 0),
    minimumUSD: usd(debt.minimum || 0, debt.currency), balanceUSD: usd(debt.remaining, debt.currency)
  }));
  const requestedBudgetUSD = Math.max(0, incomeUSD * .3 + Number(extraUSD || 0));
  const minimumRequiredUSD = debts.reduce((sum, debt) => sum + Math.min(debt.minimumUSD, debt.balanceUSD), 0);
  const monthlyBudgetUSD = Math.max(requestedBudgetUSD, minimumRequiredUSD);
  const minimumShortfallUSD = Math.max(0, minimumRequiredUSD - requestedBudgetUSD);
  if (!debts.length) return { debts, months: 0, interestUSD: 0, monthlyBudgetUSD, requestedBudgetUSD, minimumRequiredUSD, minimumShortfallUSD, firstAllocations: [], paidOffAt: {} };
  if (!(monthlyBudgetUSD > 0)) return { debts, months: Infinity, interestUSD: 0, monthlyBudgetUSD, requestedBudgetUSD, minimumRequiredUSD, minimumShortfallUSD, firstAllocations: [], paidOffAt: {} };

  let working = debts.map(debt => ({ ...debt }));
  let months = 0;
  let interestUSD = 0;
  let firstAllocations = [];
  const paidOffAt = {};
  while (working.some(debt => debt.balanceUSD > .005) && months < 600) {
    months += 1;
    const payments = new Map();
    working.forEach(debt => {
      if (debt.balanceUSD <= .005) return;
      const interest = debt.balanceUSD * debt.apr / 1200;
      debt.balanceUSD += interest;
      interestUSD += interest;
    });
    let available = monthlyBudgetUSD;
    debtPriority(working.filter(debt => debt.balanceUSD > .005), strategy).forEach(debt => {
      const payment = Math.min(debt.minimumUSD, debt.balanceUSD, available);
      if (payment > 0) {
        payments.set(debt.id, payment);
        debt.balanceUSD -= payment;
        available -= payment;
      }
    });
    for (const debt of debtPriority(working.filter(item => item.balanceUSD > .005), strategy)) {
      if (available <= .005) break;
      const payment = Math.min(debt.balanceUSD, available);
      payments.set(debt.id, (payments.get(debt.id) || 0) + payment);
      debt.balanceUSD -= payment;
      available -= payment;
    }
    working.forEach(debt => {
      if (debt.balanceUSD <= .005 && paidOffAt[debt.id] == null) paidOffAt[debt.id] = months;
    });
    if (months === 1) firstAllocations = debts.map(debt => ({ id: debt.id, name: debt.name, currency: debt.currency, amountUSD: payments.get(debt.id) || 0 }));
    const paid = [...payments.values()].reduce((sum, amount) => sum + amount, 0);
    if (paid <= .005) { months = Infinity; break; }
  }
  if (months >= 600 && working.some(debt => debt.balanceUSD > .005)) months = Infinity;
  return { debts, months, interestUSD, monthlyBudgetUSD, requestedBudgetUSD, minimumRequiredUSD, minimumShortfallUSD, firstAllocations, paidOffAt };
}

function payoffDateLabel(months) {
  if (!Number.isFinite(months)) return 'Not reducing yet';
  if (months <= 0) return 'Debt-free now';
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}

function debtPlanSummaryHtml(plan) {
  if (!plan.debts.length) return '<div class="friendlyEmpty"><b>No active debt</b><span>When every debt is cleared, the 30% bucket can move to your future.</span></div>';
  if (!(plan.monthlyBudgetUSD > 0)) return '<div class="friendlyEmpty"><b>Add salary or minimum payments</b><span>The app needs one of those amounts to build a payoff route.</span></div>';
  const firstTarget = debtPriority(plan.debts, state.settings.debtStrategy)[0];
  return `<div><b>${state.settings.debtStrategy === 'snowball' ? 'Quick-win plan' : 'Lowest-interest-cost plan'}</b><p>Minimums are covered first. Extra money targets ${esc(firstTarget?.name || 'the next debt')}.</p></div>
    <div class="debtPlanStats">
      <div><span>Monthly debt money</span><b>${baseMoney(plan.monthlyBudgetUSD)}</b></div>
      <div><span>Debt-free estimate</span><b>${payoffDateLabel(plan.months)}</b></div>
      <div><span>Estimated interest</span><b>${Number.isFinite(plan.months) ? baseMoney(plan.interestUSD) : 'Needs more'}</b></div>
    </div>
    ${plan.minimumShortfallUSD > .005 ? `<div class="warningNote" style="margin-top:10px">Minimums exceed the 30% bucket by ${baseMoney(plan.minimumShortfallUSD)}. The plan protects every minimum before sending extra to one debt.</div>` : ''}`;
}

async function setDebtStrategy(strategy) {
  if (!['avalanche', 'snowball'].includes(strategy) || state.settings.debtStrategy === strategy) return;
  state.settings.debtStrategy = strategy;
  await saveOperation({ action: 'settings', row: settingsRow() }, { close: false, message: strategy === 'snowball' ? 'Quick-win debt plan selected' : 'Interest-saving debt plan selected' });
}

function debtSimulatorResultHtml(extraUSD) {
  const metrics = moneyMetrics();
  const baseline = simulateDebtPlan(metrics.incomeUSD, 0, state.settings.debtStrategy);
  const plan = simulateDebtPlan(metrics.incomeUSD, extraUSD, state.settings.debtStrategy);
  if (!plan.debts.length) return '<div class="friendlyNote">You have no active debt to simulate.</div>';
  const monthsSaved = Number.isFinite(baseline.months) && Number.isFinite(plan.months) ? Math.max(0, baseline.months - plan.months) : 0;
  const interestSavedUSD = Number.isFinite(baseline.months) && Number.isFinite(plan.months) ? Math.max(0, baseline.interestUSD - plan.interestUSD) : 0;
  return `<div class="debtPlanStats">
      <div><span>Debt-free</span><b>${payoffDateLabel(plan.months)}</b></div>
      <div><span>Time saved</span><b>${monthsSaved} month${monthsSaved === 1 ? '' : 's'}</b></div>
      <div><span>Interest saved</span><b>${baseMoney(interestSavedUSD)}</b></div>
    </div>
    <div class="debtAllocationList">${plan.firstAllocations.filter(item => item.amountUSD > .005).map(item => `<div class="debtAllocationRow"><div><b>${esc(item.name)}</b><span>Suggested this month</span></div><div><b>${baseMoney(item.amountUSD)}</b></div></div>`).join('')}</div>`;
}

function openDebtSimulator() {
  const metrics = moneyMetrics();
  if (!activeDebts().some(debt => debt.remaining > .005)) {
    openModal('Debt what-if', '<div class="form"><div class="friendlyNote">There is no active debt to simulate.</div><button class="primary" onclick="closeModal();openDebtForm()">Add debt</button></div>');
    return;
  }
  openModal('Debt what-if', `<div class="form">
    <div class="friendlyNote">Test an extra monthly payment without changing real data. The base plan already uses ${baseMoney(metrics.incomeUSD * .3)}—30% of this month’s income.</div>
    <label>Extra each month (${esc(state.settings.base)})<input id="debtExtra" type="number" min="0" step="0.01" value="0"></label>
    <div id="debtSimulatorResult"></div>
    <button class="primary" onclick="closeModal()">Done</button>
  </div>`);
  const update = () => { $('debtSimulatorResult').innerHTML = debtSimulatorResultHtml(usd(+$('debtExtra').value || 0, state.settings.base)); };
  $('debtExtra').oninput = update;
  update();
}

function paydayAssistantHtml(metrics, buckets) {
  if (!(metrics.incomeUSD > 0)) return `<div class="paydayTop"><div><h3 data-help="payday-assistant">Payday assistant</h3><p>Add salary and the app will turn 40–30–20–10 into exact actions.</p></div><button class="primary compact" onclick="openQuickIncome({category:'Salary'})">Add salary</button></div>`;
  return `<div class="paydayTop"><div><h3 data-help="payday-assistant">Payday assistant</h3><p>One salary, four simple jobs. These targets update automatically.</p></div><button class="primary compact" onclick="openPaydayAssistant()">Use plan</button></div>
    <div class="paydayBuckets">${buckets.map(bucket => `<div><span>${bucket.pct}% ${esc(bucket.label)}</span><b>${baseMoney(bucket.target)}</b></div>`).join('')}</div>`;
}

function openPaydayAssistant() {
  const metrics = moneyMetrics();
  const buckets = allocationBuckets(metrics);
  if (!(metrics.incomeUSD > 0)) { openQuickIncome({ category: 'Salary' }); return; }
  const debtPlan = simulateDebtPlan(metrics.incomeUSD);
  const debtAction = debtPlan.firstAllocations.filter(item => item.amountUSD > .005).sort((a, b) => b.amountUSD - a.amountUSD)[0];
  const goal = activeGoals().find(item => item.saved < item.target);
  const future = buckets.find(bucket => bucket.key === 'future');
  openModal('Use this payday', `<div class="form">
    <div class="friendlyNote">These are targets, not automatic bank transfers. Record an action only after the money has actually moved.</div>
    <div class="statement">
      ${buckets.map((bucket, index) => `<div class="statementRow"><time>${bucket.pct}%</time><div><b>${esc(bucket.label)}</b><div class="meta">${bucket.key === 'essential' ? 'Keep ready for living costs' : bucket.key === 'debt' ? 'Minimums first, then the priority debt' : bucket.key === 'future' ? 'Reserve for goals and emergency savings' : 'Your flexible spending limit'}</div></div><div class="statementValue"><strong>${baseMoney(bucket.target)}</strong><span>${baseMoney(bucket.actual)} recorded</span></div></div>`).join('')}
    </div>
    <div class="buttonRow">
      ${debtAction ? `<button class="secondary" onclick="closeModal();openDebtPayment('${debtAction.id}',null,{paymentUSD:${debtAction.amountUSD}})">Record debt payment</button>` : ''}
      ${goal && future.target > 0 ? `<button class="secondary" onclick="closeModal();openGoalContribution('${goal.id}',null,{amountUSD:${future.target}})">Reserve for ${esc(goal.name)}</button>` : ''}
      <button class="primary" onclick="closeModal()">Done</button>
    </div>
  </div>`);
}

function timelineEvents() {
  const events = [];
  state.transactions.forEach(transaction => {
    const destination = accountName(transaction.toAccountId);
    events.push({
      date: transaction.date,
      group: 'money',
      kind: transaction.type,
      title: transaction.type === 'transfer' ? `Transfer to ${destination || 'account'}` : transaction.category,
      detail: transaction.type === 'transfer'
        ? `${money(transaction.amount, transaction.currency)} sent · ${money(transaction.toAmount, state.accounts.find(a => a.id === transaction.toAccountId)?.currency || transaction.currency)} received`
        : `${transaction.type === 'income' ? '+' : '−'} ${money(transaction.amount, transaction.currency)} · ${transaction.paidBy}`,
      id: transaction.id,
      action: 'transaction'
    });
    if (transaction.debtId && transaction.debtPrincipal) {
      const debt = state.debts.find(item => item.id === transaction.debtId);
      events.push({ date: transaction.date, group: 'wins', kind: 'win', title: `${debt?.name || 'Debt'} reduced`, detail: `${money(transaction.debtPrincipal, debt?.currency || transaction.currency)} principal cleared` });
    }
  });
  state.accounts.forEach(account => events.push({ date: account.openingDate, group: 'money', kind: 'account', title: `${account.name} tracking started`, detail: `Opening balance ${money(account.openingBalance, account.currency)}` }));
  state.assets.forEach(asset => asset.createdAt && events.push({ date: asset.createdAt.slice(0, 10), group: 'money', kind: 'asset', title: `${asset.name} added`, detail: `Asset · ${baseMoney(assetUSD(asset))}` }));
  state.debts.forEach(debt => {
    if (debt.createdAt) events.push({ date: debt.createdAt.slice(0, 10), group: 'plans', kind: 'debt', title: `${debt.name} added`, detail: `${money(debt.remaining, debt.currency)} remaining` });
    if (debt.due && debt.active !== false) events.push({ date: debt.due, group: 'plans', kind: 'debt', title: `${debt.name} target date`, detail: `${money(debt.remaining, debt.currency)} remaining` });
  });
  state.goals.forEach(goal => {
    if (goal.createdAt) events.push({ date: goal.createdAt.slice(0, 10), group: 'plans', kind: 'goal', title: `${goal.name} goal added`, detail: `${money(goal.saved, goal.currency)} saved` });
    if (goal.due && goal.active !== false) events.push({ date: goal.due, group: 'plans', kind: 'goal', title: `${goal.name} target date`, detail: `Goal ${money(goal.target, goal.currency)}` });
  });
  state.contributions.forEach(contribution => {
    const goal = state.goals.find(item => item.id === contribution.goalId);
    events.push({ date: contribution.date, group: 'wins', kind: 'win', title: `${goal?.name || 'Goal'} grew`, detail: `+ ${money(contribution.amount, contribution.currency)} reserved` });
  });
  state.sinkingFunds.forEach(fund => {
    if (fund.createdAt) events.push({ date: fund.createdAt.slice(0, 10), group: 'plans', kind: 'goal', title: `${fund.name} fund added`, detail: `${money(fund.target, fund.currency)} target` });
    if (fund.due && fund.active !== false) events.push({ date: fund.due, group: 'plans', kind: 'goal', title: `${fund.name} needed`, detail: `${money(fund.saved, fund.currency)} of ${money(fund.target, fund.currency)} ready` });
  });
  state.weeklyReviews.forEach(review => events.push({ date: review.completedAt?.slice(0, 10) || review.weekStart, group: 'wins', kind: 'win', title: 'Weekly money date complete', detail: review.nextAction || review.win || 'Reviewed together' }));
  state.recurring.filter(item => item.active !== false).forEach(item => events.push({ date: `${monthKey()}-${String(Math.min(item.day, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())).padStart(2, '0')}`, group: 'plans', kind: 'recurring', title: item.name, detail: `Monthly ${item.kind} · ${money(item.amount, item.currency)}` }));
  const budgetUSD = Object.values(state.budgets).reduce((sum, budget) => sum + usd(budget.amount, budget.currency), 0);
  if (budgetUSD > 0) events.push({ date: monthStart(), group: 'plans', kind: 'budget', title: 'Monthly category plan', detail: baseMoney(budgetUSD) });
  state.snapshots.forEach(snapshot => events.push({ date: snapshot.date, group: 'wins', kind: 'snapshot', title: 'Net worth check-in', detail: baseMoney(snapshot.netWorthUSD) }));
  state.checkups.forEach(checkup => {
    if (checkup.balancesCheckedAt) events.push({ date: checkup.balancesCheckedAt.slice(0, 10), group: 'wins', kind: 'win', title: 'Monthly money check complete', detail: `${checkup.accountCount} account${checkup.accountCount === 1 ? '' : 's'} confirmed${checkup.note ? ` · ${checkup.note}` : ''}` });
    if (checkup.closedAt) events.push({ date: checkup.closedAt.slice(0, 10), group: 'wins', kind: 'win', title: `${formatDate(checkup.month, { month: 'long' })} closed together`, detail: checkup.focus ? `Next focus · ${checkup.focus}` : 'Month reviewed' });
  });
  const now = today();
  return events.filter(event => event.date && (timelineFilter === 'all' || event.group === timelineFilter)).sort((a, b) => {
    const aFuture = a.date > now;
    const bFuture = b.date > now;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return aFuture ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
  });
}

function timelineHtml() {
  const events = timelineEvents();
  if (!events.length) return '<div class="card hint">Nothing in this view yet. Your actions and plans will appear automatically.</div>';
  return events.slice(0, 150).map(event => `<div class="timelineItem">
    <div class="timelineDot ${event.kind}"></div><div class="timelineBody">
      <div class="timelineDate">${esc(formatDate(event.date))}${event.date > today() ? ' · upcoming' : ''}</div>
      <div class="timelineTitle">${esc(event.title)}</div><div class="meta">${esc(event.detail)}</div>
      ${event.action === 'transaction' ? `<div class="cardActions"><button class="linkBtn" onclick="editTransaction('${event.id}')">Edit</button><button class="dangerLink" onclick="deleteTransaction('${event.id}')">Delete</button></div>` : ''}
    </div></div>`).join('');
}

function setTimelineFilter(filter) {
  timelineFilter = filter;
  render();
}

function currentWeeklyReview() { return state.weeklyReviews.find(review => review.weekStart === weekStart()); }

function moneyDateHtml(metrics) {
  const start = weekStart();
  const review = currentWeeklyReview();
  const weekTx = state.transactions.filter(transaction => transaction.date >= start && transaction.date <= today() && transaction.type !== 'transfer' && transaction.category !== 'Balance adjustment');
  const income = weekTx.filter(transaction => transaction.type === 'income').reduce((sum, transaction) => sum + usd(transaction.amount, transaction.currency), 0);
  const spent = weekTx.filter(transaction => transaction.type === 'expense').reduce((sum, transaction) => sum + usd(transaction.amount, transaction.currency), 0);
  const nextBill = recurringOccurrences(today(), addDays(today(), 14), item => item.kind === 'expense').sort((a, b) => a.date.localeCompare(b.date))[0];
  const goal = activeGoals().sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'))[0];
  const action = metrics.cashUSD < 0 ? 'Correct account balances and pause optional spending.'
    : nextBill ? `Keep ${money(nextBill.item.amount, nextBill.item.currency)} ready for ${nextBill.item.name}.`
      : activeSinkingFunds().some(fund => fund.lastReservedMonth !== monthStart()) ? 'Make this month’s first sinking-fund set-aside.'
        : activeDebts().some(debt => debt.remaining > 0) ? 'Record the next debt payment when it leaves the bank.'
          : 'Choose one small amount to move toward your nearest goal.';
  return `<div class="moneyDateTop"><div><div class="eyebrow">5-MINUTE MONEY DATE</div><h2 data-help="money-date">${review ? 'Reviewed together ✓' : 'One calm check-in'}</h2><p>${review ? `This week’s action: ${esc(review.nextAction || action)}` : 'Look at the facts, celebrate one win, and agree on one action.'}</p></div><div class="coupleMark">D<span>♥</span>S</div></div>
    <div class="moneyDateStats"><div><span>Came in</span><b>${baseMoney(income)}</b></div><div><span>Went out</span><b>${baseMoney(spent)}</b></div><div><span>Net worth</span><b>${baseMoney(metrics.netWorthUSD)}</b></div>${goal ? `<div><span>${esc(goal.name)}</span><b>${Math.round(goal.saved / Math.max(.01, goal.target) * 100)}%</b></div>` : '<div><span>Goals</span><b>Start one</b></div>'}</div>
    <div class="moneyDateAction"><span>Suggested action</span><b>${esc(action)}</b></div>
    <button class="${review ? 'secondary' : 'primary'} wide" onclick="openMoneyDate()">${review ? 'Update this week' : 'Review together'}</button>`;
}

function calendarEventsFor(month) {
  const events = [];
  const start = `${month}-01`;
  const end = monthlyDate(start, 31);
  state.recurring.filter(item => item.active !== false).forEach(item => events.push({ date: monthlyDate(start, item.day), type: item.kind, title: item.name, amount: money(item.amount, item.currency) }));
  activeDebts().filter(debt => debt.paymentDay && debt.minimum > 0).forEach(debt => {
    const alreadyListed = state.recurring.some(item => item.active !== false && item.kind === 'expense' && item.category === 'Debt' && Number(item.day) === Number(debt.paymentDay) && Math.abs(usd(item.amount, item.currency) - usd(debt.minimum, debt.currency)) < .01);
    if (!alreadyListed) events.push({ date: monthlyDate(start, debt.paymentDay), type: 'debt', title: debt.name, amount: money(debt.minimum, debt.currency) });
  });
  activeGoals().filter(goal => goal.due >= start && goal.due <= end).forEach(goal => events.push({ date: goal.due, type: 'goal', title: goal.name, amount: money(goal.target, goal.currency) }));
  activeSinkingFunds().filter(fund => fund.due >= start && fund.due <= end).forEach(fund => events.push({ date: fund.due, type: 'fund', title: fund.name, amount: money(fund.target, fund.currency) }));
  const payday = Number(state.settings.paydayDay);
  if (payday) events.push({ date: monthlyDate(start, payday), type: 'income', title: 'Expected payday', amount: '' });
  return events.sort((a, b) => a.date.localeCompare(b.date));
}

function calendarHtml(month) {
  const first = dateObject(`${month}-01`);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const events = calendarEventsFor(month);
  const cells = Array.from({ length: offset }, () => '<div class="calendarDay empty"></div>');
  for (let day = 1; day <= days; day += 1) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(event => event.date === date);
    cells.push(`<div class="calendarDay${date === today() ? ' today' : ''}${dayEvents.length ? ' hasEvent' : ''}"><b>${day}</b><div>${dayEvents.slice(0, 3).map(event => `<i class="${event.type}" title="${esc(event.title)}"></i>`).join('')}</div></div>`);
  }
  return `<div class="calendarWeek"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><div class="calendarGrid">${cells.join('')}</div>`;
}

function moveCalendar(direction) {
  if (!calendarMonth) calendarMonth = monthKey();
  calendarMonth = monthKey(addMonths(`${calendarMonth}-01`, direction));
  render();
}

function runwayHtml(metrics) {
  const essentials = Object.entries(state.budgets).filter(([category]) => ESSENTIAL_CATEGORIES.includes(category)).reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0)
    || state.recurring.filter(item => item.active !== false && item.kind === 'expense' && ESSENTIAL_CATEGORIES.includes(item.category)).reduce((sum, item) => sum + usd(item.amount, item.currency), 0);
  if (!(essentials > 0)) return '<div class="friendlyEmpty"><b>Add essential category limits first</b><span>Housing, food, transport, bills and health are used to calculate your runway.</span><button class="secondary compact" onclick="showPage(\'plan\');openBudget()">Set essentials</button></div>';
  const protectedCash = Math.max(0, metrics.cashUSD - metrics.goalSavedUSD - metrics.sinkingSavedUSD);
  const scenarios = [
    ['Current free cash', protectedCash, 'cash'],
    ['If income falls 25%', Math.max(0, protectedCash + metrics.incomeUSD * .75), 'caution'],
    ['Unexpected cost', Math.max(0, protectedCash - usd(500, state.settings.base)), 'shock']
  ];
  const currentMonths = protectedCash / essentials;
  return `<div class="runwayTop"><div class="runwayGauge" style="--runway:${Math.min(100, currentMonths / 6 * 100)}%"><div><b>${currentMonths.toFixed(1)}</b><span>months</span></div></div><div><h3>${currentMonths >= 3 ? 'A useful cushion' : currentMonths >= 1 ? 'Build the next month' : 'Cash is tight'}</h3><p>Based on ${baseMoney(essentials)} of essentials each month. Goal and sinking-fund money stays protected.</p></div></div><div class="scenarioList">${scenarios.map(([label, cash, tone]) => `<div class="${tone}"><span>${label}</span><b>${(cash / essentials).toFixed(1)} months</b></div>`).join('')}</div><button class="secondary wide" onclick="openRunwayWhatIf()">Try another income drop or expense</button>`;
}

function monthCloseHtml(metrics) {
  const checkup = currentCheckup();
  const closed = Boolean(checkup?.closedAt);
  const priorKey = monthKey(addMonths(monthStart(), -1));
  const priorTx = state.transactions.filter(transaction => transaction.date.startsWith(priorKey) && transaction.type !== 'transfer' && transaction.category !== 'Balance adjustment');
  const priorSpent = priorTx.filter(transaction => transaction.type === 'expense').reduce((sum, transaction) => sum + usd(transaction.amount, transaction.currency), 0);
  const debtPaid = metrics.monthTx.filter(transaction => transaction.debtId).reduce((sum, transaction) => sum + usd(transaction.debtPrincipal || 0, transaction.currency), 0);
  const saved = state.contributions.filter(item => item.date.startsWith(monthKey())).reduce((sum, item) => sum + usd(item.amount, item.currency), 0);
  const comparison = priorSpent > 0 ? (metrics.spentUSD - priorSpent) / priorSpent * 100 : null;
  return `<div class="closeTop"><div><h3>${closed ? `${formatDate(monthStart(), { month: 'long' })} closed ✓` : 'Finish with clean numbers'}</h3><p>${closed ? `Next focus: ${esc(checkup.focus || 'Keep the plan simple.')}` : 'Review the month without blame. Keep one lesson and one next step.'}</p></div><span class="closeSeal">${closed ? '✓' : monthKey().slice(5)}</span></div><div class="closeStats"><div><span>Spent</span><b>${baseMoney(metrics.spentUSD)}</b><small>${comparison == null ? 'First comparison month' : `${Math.abs(comparison).toFixed(0)}% ${comparison <= 0 ? 'less' : 'more'} than last month`}</small></div><div><span>Debt cleared</span><b>${baseMoney(debtPaid)}</b><small>Principal this month</small></div><div><span>Goals added</span><b>${baseMoney(saved)}</b><small>Recorded contributions</small></div></div><div class="buttonRow">${checkup?.balancesCheckedAt ? '' : '<button class="secondary" onclick="openMonthlyCheckup()">Check balances first</button>'}<button class="primary" onclick="openMonthClose()">${closed ? 'Update focus' : 'Close this month'}</button></div>`;
}

function openMoneyDate() {
  const review = currentWeeklyReview();
  openModal('Our weekly money date', `<form id="moneyDateForm" class="form"><div class="friendlyNote">No blame and no long meeting. Agree on one win and one useful action for the next seven days.</div><label>What went well?<textarea id="moneyDateWin" maxlength="300" placeholder="We recorded our spending…">${esc(review?.win || '')}</textarea></label><label>Our one next action<textarea id="moneyDateAction" maxlength="300" required placeholder="Move money to the emergency goal…">${esc(review?.nextAction || '')}</textarea></label><button class="primary" type="submit">Reviewed together ✓</button></form>`);
  $('moneyDateForm').onsubmit = async event => {
    event.preventDefault();
    const item = { id: review?.id || crypto.randomUUID(), weekStart: weekStart(), reviewedBy: currentUser.id, win: $('moneyDateWin').value.trim(), nextAction: $('moneyDateAction').value.trim(), completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const index = state.weeklyReviews.findIndex(existing => existing.id === item.id);
    if (index >= 0) state.weeklyReviews[index] = item; else state.weeklyReviews.push(item);
    await saveOperation({ action: 'moneyDate', row: { id: item.id, household_id: householdId, week_start: item.weekStart, reviewed_by: currentUser.id, win: item.win || null, next_action: item.nextAction, completed_at: item.completedAt, updated_at: item.updatedAt } }, { message: 'Weekly money date complete ✓', celebrate: true });
  };
}

function openRunwayWhatIf() {
  openModal('Emergency what-if', `<div class="form"><label>Monthly income reduction (%)<input id="runwayDrop" type="range" min="0" max="100" step="5" value="25"><span id="runwayDropLabel" class="rangeLabel">25%</span></label><label>Unexpected expense (${esc(state.settings.base)})<input id="runwayExpense" type="number" min="0" step="50" value="500"></label><div id="runwayResult" class="friendlyNote"></div><button class="primary" onclick="closeModal()">Done</button></div>`);
  const update = () => {
    const metrics = moneyMetrics();
    const essentials = Object.entries(state.budgets).filter(([category]) => ESSENTIAL_CATEGORIES.includes(category)).reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
    const drop = +$('runwayDrop').value;
    const cash = Math.max(0, metrics.cashUSD - metrics.goalSavedUSD - metrics.sinkingSavedUSD - usd(+$('runwayExpense').value || 0, state.settings.base));
    const monthlyGap = Math.max(0, essentials - metrics.incomeUSD * (1 - drop / 100));
    const months = monthlyGap > 0 ? cash / monthlyGap : Infinity;
    $('runwayDropLabel').textContent = `${drop}%`;
    $('runwayResult').innerHTML = monthlyGap <= 0 ? 'Reduced income still covers the current essential plan.' : `Free cash could cover the monthly shortfall for <b>${months.toFixed(1)} months</b>.`;
  };
  $('runwayDrop').oninput = update; $('runwayExpense').oninput = update; update();
}

function openMonthClose() {
  const existing = currentCheckup();
  openModal('Close the month', `<form id="monthCloseForm" class="form"><div class="friendlyNote">Closing a month does not lock or delete anything. It simply saves your lesson and next focus.</div><label>What should we remember?<textarea id="monthCloseNote" maxlength="300" placeholder="We spent less on takeaways…">${esc(existing?.note || '')}</textarea></label><label>One focus for next month<textarea id="monthCloseFocus" maxlength="300" required placeholder="Build the car repair fund…">${esc(existing?.focus || '')}</textarea></label><button class="primary" type="submit">Close this month ✓</button></form>`);
  $('monthCloseForm').onsubmit = async event => {
    event.preventDefault();
    const item = { id: existing?.id || crypto.randomUUID(), month: monthStart(), accountCount: existing?.accountCount || 0, adjustmentUSD: existing?.adjustmentUSD || 0, note: $('monthCloseNote').value.trim(), focus: $('monthCloseFocus').value.trim(), closedAt: new Date().toISOString(), balancesCheckedAt: existing?.balancesCheckedAt || '', completedBy: currentUser.id, completedAt: existing?.completedAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
    const index = state.checkups.findIndex(checkup => checkup.id === item.id);
    if (index >= 0) state.checkups[index] = item; else state.checkups.push(item);
    await saveOperation({ action: 'checkup', row: { id: item.id, household_id: householdId, month: item.month, completed_by: currentUser.id, account_count: item.accountCount, adjustment_total_usd: item.adjustmentUSD, note: item.note || null, focus: item.focus, closed_at: item.closedAt, balances_checked_at: item.balancesCheckedAt || null, completed_at: item.completedAt, updated_at: item.updatedAt } }, { message: 'Month closed together ✓', celebrate: true });
  };
}

function sinkingFundRow(fund) {
  return { id: fund.id, household_id: householdId, created_by: currentUser.id, name: fund.name, target_amount: fund.target, saved_amount: fund.saved, currency: fund.currency, due_date: fund.due || null, last_reserved_month: fund.lastReservedMonth || null, note: fund.note || null, active: fund.active !== false, updated_at: new Date().toISOString() };
}

function openSinkingFundForm(id = null) {
  const fund = id ? state.sinkingFunds.find(item => item.id === id) : null;
  openModal(fund ? 'Edit sinking fund' : 'Add sinking fund', `<form id="sinkingFundForm" class="form"><div class="friendlyNote">Use this for expected costs such as annual insurance, travel, gifts, repairs or medical expenses—not long-term dreams already tracked in Goals.</div><label>Name<input id="fundName" required maxlength="100" value="${esc(fund?.name || '')}" placeholder="Annual insurance"></label><div class="fieldRow"><label>Target amount<input id="fundTarget" type="number" min="0.01" step="0.01" required value="${fund?.target ?? ''}"></label><label>Currency<select id="fundCurrency">${currencyOptions(fund?.currency || state.settings.lastCurrency)}</select></label></div><label>Already set aside<input id="fundSaved" type="number" min="0" step="0.01" required value="${fund?.saved ?? 0}"></label><label>Needed by<input id="fundDue" type="date" min="${today()}" value="${fund?.due || ''}"></label><label>Note<input id="fundNote" maxlength="300" value="${esc(fund?.note || '')}" placeholder="Optional"></label><button class="primary" type="submit">Save sinking fund</button></form>`);
  $('sinkingFundForm').onsubmit = async event => {
    event.preventDefault();
    const item = { id: fund?.id || crypto.randomUUID(), name: $('fundName').value.trim(), target: +$('fundTarget').value, saved: +$('fundSaved').value || 0, currency: $('fundCurrency').value, due: $('fundDue').value, lastReservedMonth: fund?.lastReservedMonth || '', note: $('fundNote').value.trim(), active: true, createdAt: fund?.createdAt || new Date().toISOString() };
    if (item.saved > item.target) item.saved = item.target;
    rememberCurrency(item.currency);
    const index = state.sinkingFunds.findIndex(existing => existing.id === item.id);
    if (index >= 0) state.sinkingFunds[index] = item; else state.sinkingFunds.push(item);
    await saveOperation({ action: 'upsert', table: 'sinking_funds', row: sinkingFundRow(item) }, { message: 'Sinking fund saved ✓' });
  };
}

async function reserveSinkingFund(id) {
  const fund = state.sinkingFunds.find(item => item.id === id);
  if (!fund || fund.lastReservedMonth === monthStart()) return;
  const amountUSD = Math.min(sinkingMonthlyNeedUSD(fund), usd(fund.target - fund.saved, fund.currency));
  fund.saved = Math.min(fund.target, fund.saved + fromUSD(amountUSD, fund.currency));
  fund.lastReservedMonth = monthStart();
  await saveOperation({ action: 'upsert', table: 'sinking_funds', row: sinkingFundRow(fund) }, { close: false, message: `${fund.name} set-aside recorded ✓`, celebrate: fund.saved + .005 >= fund.target });
}

async function archiveSinkingFund(id) {
  const fund = state.sinkingFunds.find(item => item.id === id);
  if (!fund || !confirm(`Archive ${fund.name}? Its saved history will remain in backups.`)) return;
  fund.active = false;
  await saveOperation({ action: 'upsert', table: 'sinking_funds', row: sinkingFundRow(fund) }, { close: false, message: 'Sinking fund archived' });
}

function render() {
  if (!$('app')) return;
  const metrics = moneyMetrics();
  const buckets = allocationBuckets(metrics);
  const safe = safeSpendPlan(metrics, buckets);
  const name = state.member.displayName || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  $('greeting').textContent = `Our DHAN · ${name}`;
  $('todayDate').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  $('todayHello').textContent = `${greeting}, ${name}`;
  $('trackingBadge').textContent = pending().length ? 'Saving offline' : 'Together ✓';
  $('trackingBadge').className = `statusBadge${pending().length ? ' warn' : ''}`;

  $('safeToday').textContent = safe.ready ? baseMoney(safe.dailyUSD) : 'Not ready yet';
  $('safeWeek').textContent = safe.ready ? baseMoney(safe.weeklyUSD) : '—';
  $('nextPayday').textContent = safe.payday ? formatDate(safe.payday.date, { day: 'numeric', month: 'short' }) : 'Not set';
  $('safeProtected').textContent = safe.ready ? baseMoney(safe.protectedUSD) : '—';
  $('safeBuffer').textContent = safe.ready ? baseMoney(safe.bufferUSD) : '—';
  $('safeMessage').textContent = safe.ready
    ? safe.shortfallUSD > .005
      ? `Pause optional spending for now. Protected commitments are ${baseMoney(safe.shortfallUSD)} above free cash.`
      : safe.remainingUSD + .005 < safe.wantsRemainingUSD
        ? `Your real available cash—not only the 10% allowance—sets this safer limit until payday.`
        : `${baseMoney(safe.remainingUSD)} of the 10% wants allowance is safely available until payday.`
    : metrics.incomeUSD > 0 ? 'Set the salary day in Settings to calculate a safe daily fun amount.' : 'Add salary and set the salary day to calculate this safely.';
  $('todayCash').textContent = baseMoney(metrics.cashUSD);
  $('todayReserved').textContent = baseMoney(metrics.goalSavedUSD + metrics.sinkingSavedUSD);
  $('todaySurplus').textContent = baseMoney(metrics.surplusUSD);
  $('todayAllocation').innerHTML = buckets.map(bucket => `<div class="bucket ${bucket.key}"><span>${bucket.pct}% ${esc(bucket.label)}</span><b>${baseMoney(bucket.target)}</b><small>${baseMoney(bucket.actual)} used</small></div>`).join('');
  $('monthlyCheckupCard').innerHTML = monthlyCheckupHtml();

  const currentRecurringMonth = monthStart();
  const dueItems = state.recurring.filter(item => item.active !== false).sort((a, b) => a.day - b.day);
  const currentMonthLastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  $('dueList').innerHTML = dueItems.length ? dueItems.map(item => {
    const done = state.transactions.some(t => t.recurringItemId === item.id && t.recurringMonth === currentRecurringMonth);
    const dueDate = `${monthKey()}-${String(Math.min(item.day, currentMonthLastDay)).padStart(2, '0')}`;
    return `<div class="dueItem${done ? ' done' : ''}"><div class="dueIcon">${done ? '✓' : item.kind === 'income' ? '↑' : '○'}</div><div class="dueBody"><b>${esc(item.name)}</b><span>${money(item.amount, item.currency)} · due ${formatDate(dueDate, { day: 'numeric', month: 'short' })}</span></div><button ${done ? 'disabled' : `onclick="confirmRecurring('${item.id}')"`}>${done ? 'Done' : 'Confirm'}</button></div>`;
  }).join('') : '<div class="card friendlyEmpty"><b>No monthly checklist yet</b><span>Add salary, rent or bills once, then confirm them each month.</span><button class="secondary compact" onclick="openRecurringForm()">＋ Add regular item</button></div>';

  const sortedTransactions = [...state.transactions].sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  $('recentList').innerHTML = sortedTransactions.length ? sortedTransactions.slice(0, 6).map(t => transactionHtml(t)).join('') : '<div class="hint" style="padding:16px 0">No activity yet. Add salary or a spend to begin.</div>';

  $('netWorth').textContent = baseMoney(metrics.netWorthUSD);
  $('moneyCash').textContent = baseMoney(metrics.cashUSD);
  $('moneyAssets').textContent = baseMoney(metrics.assetsUSD);
  $('moneyDebt').textContent = baseMoney(metrics.debtUSD);
  $('moneySpendable').textContent = baseMoney(metrics.spendableUSD);
  $('netWorthMood').textContent = metrics.netWorthUSD < 0 ? '🧗' : metrics.debtUSD > 0 ? '🌱' : '🌳';
  $('wealthMessage').textContent = metrics.netWorthUSD < 0
    ? 'Every principal payment lifts this number. You are moving, not stuck.'
    : metrics.debtUSD > 0 ? 'Your assets are growing while you work toward debt freedom.'
      : metrics.netWorthUSD > 0 ? 'You are building real momentum together.' : 'Add your real balances to see your starting point.';
  $('actualChartButton').classList.toggle('active', wealthChartMode === 'actual');
  $('projectionChartButton').classList.toggle('active', wealthChartMode === 'projection');
  $('wealthChart').innerHTML = wealthChartMode === 'actual' ? actualChartHtml(metrics) : projectionChartHtml(metrics);

  const accountCards = activeAccounts().map(account => {
    const native = accountBalanceNative(account);
    const converted = account.currency === state.settings.base ? '' : baseMoney(usd(native, account.currency));
    return `<div class="accountCard"><div class="cardTop"><div><span class="accountBadge">${esc(accountTypeLabel(account.type))}</span><h3>${esc(account.name)}</h3><div class="meta">Since ${esc(account.openingDate)}${account.notes ? ` · ${esc(account.notes)}` : ''}</div></div><div class="value">${money(native, account.currency)}${converted ? `<div class="meta">${converted}</div>` : ''}</div></div><div class="cardActions"><button class="linkBtn" onclick="openAccountStatement('${account.id}')">Statement</button><button class="linkBtn" onclick="reconcileAccount('${account.id}')">Correct balance</button><button class="linkBtn" onclick="openAccountForm('${account.id}')">Edit</button><button class="dangerLink" onclick="archiveAccount('${account.id}')">Archive</button></div></div>`;
  });
  if (Math.abs(metrics.unassignedCashUSD) > .005 || state.transactions.some(t => !t.accountId && t.type !== 'transfer')) {
    const count = state.transactions.filter(t => !t.accountId && t.type !== 'transfer').length;
    accountCards.push(`<div class="accountCard unassigned"><div class="cardTop"><div><span class="accountBadge">Not linked</span><h3>Older entries</h3><div class="meta">${count} record${count === 1 ? '' : 's'} without an account. They still count in Money available.</div></div><div class="value">${baseMoney(metrics.unassignedCashUSD)}</div></div></div>`);
  }
  $('accountList').innerHTML = accountCards.length ? accountCards.join('') : '<div class="card friendlyEmpty"><b>Start with the bank</b><span>Add today’s real balance, then choose this account for salary and spending.</span><button class="secondary compact" onclick="openAccountForm()">＋ Add account</button></div>';

  $('assetTotal').textContent = baseMoney(metrics.assetsUSD);
  $('marketStrip').innerHTML = ['XAU', 'XAG', 'BTC', 'ETH'].map(symbol => {
    const price = state.prices[symbol];
    return `<div class="quote"><span>${symbol}${['XAU', 'XAG'].includes(symbol) ? ' / oz' : ''}</span><b>${price ? money(price.usd, 'USD') : '—'}</b></div>`;
  }).join('');
  $('assetList').innerHTML = state.assets.length ? state.assets.map(asset => {
    const value = assetUSD(asset);
    const missing = ['metal', 'crypto'].includes(asset.type) && !state.prices[asset.symbol];
    return `<div class="assetCard"><div class="cardTop"><div><h3>${esc(asset.name)}</h3><div class="meta">${esc(marketLabel(asset))}${asset.notes ? ` · ${esc(asset.notes)}` : ''}</div>${asset.type === 'cash' ? '<div class="meta legacyNote">Legacy cash asset: move this to Accounts when convenient.</div>' : ''}${missing ? '<div class="meta">Waiting for a live price; excluded from total for now.</div>' : ''}</div><div class="value">${baseMoney(value)}</div></div><div class="cardActions"><button class="linkBtn" onclick="openAssetForm('${asset.id}')">Edit</button><button class="dangerLink" onclick="deleteAsset('${asset.id}')">Delete</button></div></div>`;
  }).join('') : '<div class="card hint">No other assets yet. Bank balances belong in Accounts above.</div>';
  const suggestions = buildSuggestions(metrics, buckets);
  $('moneySuggestions').innerHTML = suggestions.map(([title, body], index) => `<div class="adviceCard"><span class="adviceNumber">${index + 1}</span><div><h3>${esc(title)}</h3><p>${esc(body)}</p></div></div>`).join('');

  $('planIncome').textContent = metrics.incomeUSD > 0 ? `${baseMoney(metrics.incomeUSD)} income` : 'Add salary';
  $('planIncome').className = `statusBadge${metrics.incomeUSD > 0 ? '' : ' warn'}`;
  $('planAllocation').innerHTML = buckets.map(bucket => `<div class="allocationItem ${bucket.key}"><div class="allocationHeading"><span class="allocationColor"></span><b>${bucket.pct}% ${esc(bucket.label)}</b></div><div class="allocationTarget">${baseMoney(bucket.target)}</div><div class="allocationActual">Used ${baseMoney(bucket.actual)}</div></div>`).join('');
  $('paydayAssistant').innerHTML = paydayAssistantHtml(metrics, buckets);

  const essentialsBudgetUSD = Object.entries(state.budgets).filter(([category]) => ESSENTIAL_CATEGORIES.includes(category)).reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
  const emergencyThreeUSD = essentialsBudgetUSD * 3;
  const emergencySixUSD = essentialsBudgetUSD * 6;
  const emergencyGoal = activeGoals().find(goal => /emergency/i.test(goal.name));
  const emergencySavedUSD = emergencyGoal ? usd(emergencyGoal.saved, emergencyGoal.currency) : 0;
  $('emergencyFundCard').innerHTML = `<div class="emergencyTop"><div class="emergencyIcon">☂️</div><div><h3 data-help="emergency-fund">Emergency fund</h3><p>Based on essential category limits of ${baseMoney(essentialsBudgetUSD)} a month. Start with 3 months, then grow toward 6.</p></div></div><div class="emergencyNumbers"><div><span>First target · 3 months</span><b>${baseMoney(emergencyThreeUSD)}</b></div><div><span>Strong target · 6 months</span><b>${baseMoney(emergencySixUSD)}</b></div></div><div class="progress" style="margin-top:11px"><i style="width:${Math.min(100, emergencySavedUSD / Math.max(.01, emergencyThreeUSD) * 100)}%"></i></div><div class="cardActions" style="margin-top:10px">${emergencyGoal ? `<button class="linkBtn" onclick="openGoalContribution('${emergencyGoal.id}')">＋ Add saving</button>` : `<button class="linkBtn" onclick="createEmergencyGoal()">Create this goal</button>`}</div>`;

  const debtPlan = simulateDebtPlan(metrics.incomeUSD);
  document.querySelectorAll('#debtStrategyTabs button').forEach(button => button.classList.toggle('active', button.dataset.strategy === state.settings.debtStrategy));
  $('debtPlanSummary').innerHTML = debtPlanSummaryHtml(debtPlan);
  const debts = activeDebts().filter(debt => debt.active !== false || debt.remaining > 0);
  $('debtList').innerHTML = debts.length ? debts.map(debt => {
    const progress = Math.max(0, Math.min(100, (1 - debt.remaining / Math.max(debt.original, .01)) * 100));
    const payoffMonth = debtPlan.paidOffAt[debt.id];
    const allocation = debtPlan.firstAllocations.find(item => item.id === debt.id)?.amountUSD || 0;
    const estimateText = debt.remaining <= .005 ? 'Cleared' : payoffMonth ? `${payoffDateLabel(payoffMonth)} · ${baseMoney(allocation)} suggested this month` : !Number.isFinite(debtPlan.months) && debtPlan.monthlyBudgetUSD > 0 ? 'Current payment does not clear the growing interest' : 'Add salary or a minimum payment for an estimate';
    return `<div class="debtCard"><div class="cardTop"><div><h3>${esc(debt.name)}</h3><div class="meta">${money(debt.remaining, debt.currency)} left of ${money(debt.original, debt.currency)}${debt.apr ? ` · ${debt.apr}% APR` : ''}</div><div class="meta">${esc(estimateText)}</div></div><span class="pill${debt.remaining <= 0 ? '' : ' warn'}">${Math.round(progress)}% paid</span></div><div class="miniBar"><i style="width:${progress}%"></i></div><div class="cardActions">${debt.remaining > 0 ? `<button class="linkBtn" onclick="openDebtPayment('${debt.id}')">Make payment</button>` : ''}<button class="linkBtn" onclick="openDebtForm('${debt.id}')">Edit</button>${debt.remaining <= 0 ? `<button class="dangerLink" onclick="archiveDebt('${debt.id}')">Archive</button>` : ''}</div></div>`;
  }).join('') : '<div class="card friendlyEmpty"><b>No active debts</b><span>Add a balance to make a clear payoff plan.</span><button class="secondary compact" onclick="openDebtForm()">＋ Add debt</button></div>';

  const goals = activeGoals();
  $('goalList').innerHTML = goals.length ? goals.map(goal => {
    const progress = Math.max(0, Math.min(100, goal.saved / Math.max(goal.target, .01) * 100));
    const latest = state.contributions.filter(c => c.goalId === goal.id).sort((a, b) => b.date.localeCompare(a.date))[0];
    return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(goal.name)}</h3><div class="meta">${money(goal.saved, goal.currency)} of ${money(goal.target, goal.currency)}${goal.due ? ` · target ${formatDate(goal.due)}` : ''}</div>${latest ? `<div class="meta">Last added ${money(latest.amount, latest.currency)} on ${formatDate(latest.date)}</div>` : ''}</div><span class="pill">${Math.round(progress)}%</span></div><div class="miniBar"><i style="width:${progress}%"></i></div><div class="cardActions"><button class="linkBtn" onclick="openGoalContribution('${goal.id}')">＋ Add saving</button><button class="linkBtn" onclick="openGoalHistory('${goal.id}')">History</button><button class="linkBtn" onclick="openGoalForm('${goal.id}')">Edit</button><button class="dangerLink" onclick="archiveGoal('${goal.id}')">Archive</button></div></div>`;
  }).join('') : '<div class="card friendlyEmpty"><b>No active goals</b><span>Add one clear target and celebrate every contribution.</span><button class="secondary compact" onclick="openGoalForm()">＋ Add goal</button></div>';

  const funds = state.sinkingFunds.filter(fund => fund.active !== false);
  const monthlyFundNeedUSD = activeSinkingFunds().reduce((sum, fund) => sum + sinkingMonthlyNeedUSD(fund), 0);
  $('sinkingFundSummary').innerHTML = funds.length ? `<div><span>Set aside each month</span><b>${baseMoney(monthlyFundNeedUSD)}</b></div><div><span>Already protected</span><b>${baseMoney(metrics.sinkingSavedUSD)}</b></div>` : '';
  $('sinkingFundList').innerHTML = funds.length ? funds.map(fund => {
    const progress = Math.max(0, Math.min(100, fund.saved / Math.max(.01, fund.target) * 100));
    const monthly = sinkingMonthlyNeedUSD(fund);
    const reserved = fund.lastReservedMonth === monthStart();
    return `<div class="fundCard"><div class="cardTop"><div><h3>${esc(fund.name)}</h3><div class="meta">${money(fund.saved, fund.currency)} of ${money(fund.target, fund.currency)}${fund.due ? ` · needed ${formatDate(fund.due)}` : ''}</div><div class="meta">${fund.saved + .005 >= fund.target ? 'Fully prepared' : `${baseMoney(monthly)} a month keeps this on track`}</div></div><span class="pill${reserved ? '' : ' warn'}">${reserved ? 'Set aside ✓' : `${Math.round(progress)}%`}</span></div><div class="miniBar"><i style="width:${progress}%"></i></div><div class="cardActions">${!reserved && fund.saved + .005 < fund.target ? `<button class="linkBtn" onclick="reserveSinkingFund('${fund.id}')">Reserve ${baseMoney(monthly)}</button>` : ''}<button class="linkBtn" onclick="openSinkingFundForm('${fund.id}')">Edit</button><button class="dangerLink" onclick="archiveSinkingFund('${fund.id}')">Archive</button></div></div>`;
  }).join('') : '<div class="card friendlyEmpty"><b>Turn future surprises into small monthly amounts</b><span>Start with one predictable cost such as insurance, travel or repairs.</span><button class="secondary compact" onclick="openSinkingFundForm()">＋ Add sinking fund</button></div>';

  $('budgetList').innerHTML = Object.keys(state.budgets).length ? Object.entries(state.budgets).map(([category, budget]) => {
    const spent = metrics.monthTx.filter(t => t.type === 'expense' && t.category === category).reduce((sum, t) => sum + usd(t.amount, t.currency), 0);
    const limit = usd(budget.amount, budget.currency);
    const ratio = Math.min(100, spent / Math.max(.01, limit) * 100);
    return `<div class="goalCard"><div class="cardTop"><div><h3>${esc(category)}</h3><div class="meta">${baseMoney(spent)} spent of ${baseMoney(limit)}</div></div><span class="pill${spent > limit ? ' danger' : ''}">${Math.round(ratio)}%</span></div><div class="miniBar"><i style="width:${ratio}%"></i></div></div>`;
  }).join('') : '<div class="card hint">No category budget yet.</div>';

  const recurringItems = state.recurring.filter(item => item.active !== false).sort((a, b) => a.day - b.day);
  $('recurringList').innerHTML = recurringItems.length ? recurringItems.map(item => `<div class="recurringCard"><div class="cardTop"><div><h3>${esc(item.name)}</h3><div class="meta">${item.kind === 'income' ? 'Income' : 'Expense'} · ${money(item.amount, item.currency)} · day ${item.day}${item.accountId ? ` · ${esc(accountName(item.accountId))}` : ''}</div></div><span class="pill">Monthly</span></div><div class="cardActions"><button class="linkBtn" onclick="openRecurringForm('${item.id}')">Edit</button><button class="dangerLink" onclick="archiveRecurring('${item.id}')">Archive</button></div></div>`).join('') : '<div class="card hint">No regular items yet.</div>';

  document.querySelectorAll('#cashflowTabs button').forEach(button => button.classList.toggle('active', Number(button.dataset.days) === cashflowDays));
  $('cashflowChart').innerHTML = cashflowChartHtml(cashflowForecast(cashflowDays));
  document.querySelectorAll('#timelineFilters button').forEach(button => button.classList.toggle('active', button.dataset.filter === timelineFilter));
  $('timelineList').innerHTML = timelineHtml();

  if (!calendarMonth) calendarMonth = monthKey();
  $('moneyDateCard').innerHTML = moneyDateHtml(metrics);
  $('togetherBadge').textContent = currentWeeklyReview() ? 'Reviewed ✓' : 'This week';
  $('togetherBadge').className = `statusBadge${currentWeeklyReview() ? '' : ' warn'}`;
  $('calendarTitle').textContent = formatDate(`${calendarMonth}-01`, { month: 'long', year: 'numeric' });
  $('moneyCalendar').innerHTML = calendarHtml(calendarMonth);
  const agenda = calendarEventsFor(calendarMonth);
  $('calendarAgenda').innerHTML = agenda.length ? agenda.map(event => `<div class="agendaItem"><time>${formatDate(event.date, { day: 'numeric', month: 'short' })}</time><i class="${event.type}"></i><div><b>${esc(event.title)}</b><span>${esc(event.amount || (event.type === 'income' ? 'Payday' : ''))}</span></div></div>`).join('') : '<div class="card hint">No planned money events this month.</div>';
  $('runwayCard').innerHTML = runwayHtml(metrics);
  $('monthCloseCard').innerHTML = monthCloseHtml(metrics);

  $('baseCurrency').value = state.settings.base;
  $('paydayDay').value = state.settings.paydayDay || '';
  $('rateAED').value = state.settings.rates.AED;
  $('rateMVR').value = state.settings.rates.MVR;
  $('rateINR').value = state.settings.rates.INR;
  queueMicrotask(() => syncAllInlineControls());
}

function accountSelectOptions(selected = '', includeEmpty = true) {
  return `${includeEmpty ? '<option value="">Not linked to an account</option>' : ''}${activeAccounts().map(account => `<option value="${account.id}"${account.id === selected ? ' selected' : ''}>${esc(account.name)} · ${account.currency}</option>`).join('')}`;
}

function transactionRow(transaction) {
  return {
    id: transaction.id,
    household_id: householdId,
    user_id: currentUser.id,
    type: transaction.type,
    amount: transaction.amount,
    currency: transaction.currency,
    category: transaction.category,
    paid_by: transaction.paidBy,
    account_id: transaction.accountId || null,
    account: transaction.account || null,
    to_account_id: transaction.toAccountId || null,
    to_amount: transaction.toAmount == null ? null : transaction.toAmount,
    debt_id: transaction.debtId || null,
    debt_principal: transaction.debtPrincipal == null ? null : transaction.debtPrincipal,
    debt_interest: transaction.debtId ? Number(transaction.debtInterest || 0) : null,
    recurring_item_id: transaction.recurringItemId || null,
    recurring_month: transaction.recurringItemId ? transaction.recurringMonth || monthStart(transaction.date) : null,
    date: transaction.date,
    note: transaction.note || null,
    updated_at: new Date().toISOString()
  };
}

function quickNote(category) {
  return QUICK_NOTE_SUGGESTIONS[category] || '';
}

function openQuickExpense() {
  openQuickTransaction('expense');
}

function openQuickIncome(options = {}) {
  openQuickTransaction('income', options);
}

function openQuickTransaction(type, options = {}) {
  const accounts = activeAccounts();
  const isIncome = type === 'income';
  const rememberedAccountId = isIncome ? state.settings.lastIncomeAccountId : state.settings.lastExpenseAccountId;
  const rememberedAccount = accounts.some(a => a.id === rememberedAccountId) ? rememberedAccountId : accounts[0]?.id || '';
  const rememberedCategory = isIncome
    ? (INCOME_CATEGORIES.includes(options.category) ? options.category : 'Salary')
    : (EXPENSE_CATEGORIES.some(([category]) => category === state.settings.lastExpenseCategory) ? state.settings.lastExpenseCategory : 'Food');
  const categories = isIncome ? INCOME_CATEGORIES.map(category => [category, INCOME_CATEGORY_ICONS[category]]) : EXPENSE_CATEGORIES;
  const suggestedNote = options.note || quickNote(rememberedCategory);
  const startingCurrency = accounts.find(a => a.id === rememberedAccount)?.currency || options.currency || state.settings.lastCurrency;
  openModal(isIncome ? 'Add income' : 'Add spend', `<form id="quickTransactionForm" class="form quickEntryForm" data-flow-manual="true">
    <section class="flowStep" data-flow-title="Date, amount and currency">
      <label>Date<input id="quickDate" type="date" value="${options.date || today()}" required></label>
      <label class="amountField">Amount<span id="quickAmountPrefix" class="amountPrefix">${esc(startingCurrency)}</span><input id="quickAmount" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="0.00" value="${esc(options.amount || '')}" required></label>
      <label>Currency<select id="quickCurrency">${currencyOptions(startingCurrency)}</select></label>
    </section>
    <section class="flowStep" data-flow-title="${isIncome ? 'Received in' : 'Paid from'}">
      <label>${isIncome ? 'Which account received it?' : 'Which account paid?'}<select id="quickAccount">${accounts.length ? accounts.map(account => `<option value="${account.id}"${account.id === rememberedAccount ? ' selected' : ''}>${esc(account.name)} · ${account.currency}</option>`).join('') : '<option value="">Not linked</option>'}</select></label>
      ${accounts.length ? '' : '<div class="friendlyNote">You can save now and add the bank account later.</div>'}
    </section>
    <section class="flowStep" data-flow-title="${isIncome ? 'Income type' : 'Reason'}">
      <label>${isIncome ? 'What type of income?' : 'What was it for?'}<select id="quickCategory">${categories.map(([category, icon]) => `<option value="${esc(category)}"${category === rememberedCategory ? ' selected' : ''}>${icon} ${esc(category)}</option>`).join('')}</select></label>
    </section>
    <section class="flowStep" data-flow-title="${isIncome ? 'Received by' : 'Who paid'}">
      <label>${isIncome ? 'Who received it?' : 'Who paid?'}<select id="quickPaidBy">${peopleOptions(options.paidBy || defaultPerson())}</select></label>
    </section>
    <section class="flowStep" data-flow-title="Note and save">
      <label>Short note<input id="quickNote" maxlength="160" value="${esc(suggestedNote)}" aria-describedby="quickNoteHint"><small id="quickNoteHint" class="fieldHint">Suggested from the reason—edit it or clear it.</small></label>
      <button class="primary quickSave" type="submit">${isIncome ? 'Save income' : 'Save spend'}</button>
    </section>
  </form>`);
  let category = rememberedCategory;
  let accountId = rememberedAccount;
  let autoNote = suggestedNote;
  $('quickPaidBy').value = options.paidBy || defaultPerson();
  $('quickCurrency').onchange = () => { $('quickAmountPrefix').textContent = $('quickCurrency').value; };
  $('quickCategory').onchange = () => {
    category = $('quickCategory').value;
    const note = $('quickNote');
    if (!note.value.trim() || note.value === autoNote) {
      autoNote = quickNote(category);
      note.value = autoNote;
    }
  };
  $('quickAccount').onchange = () => {
    accountId = $('quickAccount').value;
    const accountCurrency = accounts.find(a => a.id === accountId)?.currency;
    if (accountCurrency) {
      $('quickCurrency').value = accountCurrency;
      syncInlineOptionWheel($('quickCurrency'), false);
    }
    $('quickAmountPrefix').textContent = accountCurrency || $('quickCurrency').value;
  };
  $('quickTransactionForm').onsubmit = async event => {
    event.preventDefault();
    const account = accounts.find(a => a.id === accountId);
    const date = $('quickDate').value;
    if (account && date < account.openingDate) { toast(`Choose ${account.openingDate} or later for this account.`); return; }
    const transaction = {
      id: crypto.randomUUID(), type, amount: +$('quickAmount').value,
      currency: account?.currency || $('quickCurrency').value, category, paidBy: $('quickPaidBy').value,
      accountId: account?.id || '', account: account?.name || '', toAccountId: '', toAmount: null,
      debtId: '', debtPrincipal: null, debtInterest: 0, recurringItemId: options.recurringItemId || '', recurringMonth: options.recurringMonth || '',
      date, note: $('quickNote').value.trim(), createdAt: new Date().toISOString()
    };
    if (isIncome) state.settings.lastIncomeAccountId = transaction.accountId;
    else {
      state.settings.lastExpenseCategory = category;
      state.settings.lastExpenseAccountId = transaction.accountId;
    }
    rememberCurrency(transaction.currency);
    state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: isIncome ? 'Income added ✓' : 'Spend recorded ✓', celebrate: isIncome });
    ensureTodaySnapshot();
  };
}

function openTransaction(type, id = null, options = {}) {
  const existing = id ? state.transactions.find(t => t.id === id) : null;
  if (existing?.type === 'transfer') { openTransfer(id); return; }
  if (existing?.debtId) { openDebtPayment(existing.debtId, id); return; }
  if (existing) type = existing.type;
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES.map(([category]) => category);
  const selectedCategory = existing?.category || options.category || categories[0];
  const selectedAccount = existing?.accountId || options.accountId || '';
  openModal(existing ? `Edit ${type}` : type === 'income' ? 'Add income' : 'Add expense', `<form class="form" id="transactionForm" data-flow-manual="true">
    <section class="flowStep" data-flow-title="Date, amount and currency">
      <label>Date<input id="transactionDate" type="date" required value="${existing?.date || options.date || today()}"></label>
      <label>Amount<input id="transactionAmount" type="number" step="0.01" min="0.01" required value="${existing?.amount ?? options.amount ?? ''}"></label>
      <label>Currency<select id="transactionCurrency">${currencyOptions(existing?.currency || options.currency || state.settings.lastCurrency)}</select></label>
    </section>
    <section class="flowStep" data-flow-title="${type === 'income' ? 'Received in' : 'Paid from'}"><label>Account<select id="transactionAccount">${accountSelectOptions(selectedAccount)}</select></label>${activeAccounts().length ? '' : '<div class="friendlyNote">Add a bank or cash account later to update its balance automatically.</div>'}</section>
    <section class="flowStep" data-flow-title="${type === 'income' ? 'Income type' : 'Reason'}"><label>${type === 'income' ? 'Income type' : 'What was it for?'}<select id="transactionCategory">${[...new Set([selectedCategory, ...categories])].map(category => `<option>${esc(category)}</option>`).join('')}</select></label></section>
    <section class="flowStep" data-flow-title="${type === 'income' ? 'Received by' : 'Who paid'}"><label>${type === 'income' ? 'Received by' : 'Paid by'}<select id="transactionPaidBy">${peopleOptions(existing?.paidBy || options.paidBy || defaultPerson())}</select></label></section>
    <section class="flowStep" data-flow-title="Note and save"><label>Note<input id="transactionNote" maxlength="200" value="${esc(existing?.note || options.note || '')}" placeholder="Optional"></label><button class="primary" type="submit">Save ${type}</button></section>
  </form>`);
  $('transactionCategory').value = selectedCategory;
  $('transactionPaidBy').value = existing?.paidBy || options.paidBy || defaultPerson();
  $('transactionAccount').value = selectedAccount;
  const syncCurrency = () => {
    const account = state.accounts.find(a => a.id === $('transactionAccount').value);
    $('transactionCurrency').disabled = !!account;
    if (account) $('transactionCurrency').value = account.currency;
    syncInlineOptionWheel($('transactionCurrency'), false);
  };
  $('transactionAccount').onchange = syncCurrency;
  syncCurrency();
  $('transactionForm').onsubmit = async event => {
    event.preventDefault();
    const account = state.accounts.find(a => a.id === $('transactionAccount').value);
    const date = $('transactionDate').value;
    if (account && date < account.openingDate) { toast(`Choose ${account.openingDate} or later for ${account.name}.`); return; }
    const transaction = {
      id: existing?.id || crypto.randomUUID(), type, amount: +$('transactionAmount').value,
      currency: account?.currency || $('transactionCurrency').value, category: $('transactionCategory').value,
      paidBy: $('transactionPaidBy').value, accountId: account?.id || '', account: account?.name || '',
      toAccountId: '', toAmount: null, debtId: '', debtPrincipal: null, debtInterest: 0,
      recurringItemId: existing?.recurringItemId || options.recurringItemId || '',
      recurringMonth: existing?.recurringMonth || options.recurringMonth || '',
      date, note: $('transactionNote').value.trim(), createdAt: existing?.createdAt || new Date().toISOString()
    };
    rememberCurrency(transaction.currency);
    const index = state.transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) state.transactions[index] = transaction;
    else state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: type === 'income' ? 'Income added ✓' : 'Expense saved ✓', celebrate: type === 'income' });
    ensureTodaySnapshot();
  };
}

function openTransfer(id = null) {
  const existing = id ? state.transactions.find(t => t.id === id && t.type === 'transfer') : null;
  const accounts = activeAccounts();
  if (accounts.length < 2) {
    openModal('Transfer between accounts', `<div class="form"><div class="friendlyNote">Add at least two active accounts first. A transfer moves money without changing income, spending or net worth.</div><button class="primary" onclick="closeModal();openAccountForm()">Add another account</button></div>`);
    return;
  }
  const sourceId = existing?.accountId || accounts[0].id;
  const destinationId = existing?.toAccountId || accounts.find(a => a.id !== sourceId)?.id;
  openModal(existing ? 'Edit transfer' : 'Transfer money', `<form class="form" id="transferForm">
    <div class="friendlyNote">One linked transfer updates both account balances and never counts as income or spending.</div>
    <label>From account<select id="transferFrom">${accountSelectOptions(sourceId, false)}</select></label>
    <label>To account<select id="transferTo">${accountSelectOptions(destinationId, false)}</select></label>
    <div class="fieldRow"><label>Amount sent <span id="transferFromCurrency"></span><input id="transferAmount" type="number" min="0.01" step="0.01" required value="${existing?.amount ?? ''}"></label><label>Amount received <span id="transferToCurrency"></span><input id="transferReceived" type="number" min="0.01" step="0.01" required value="${existing?.toAmount ?? ''}"></label></div>
    <label>Date<input id="transferDate" type="date" required value="${existing?.date || today()}"></label>
    <label>Note<input id="transferNote" maxlength="200" value="${esc(existing?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save transfer</button>
  </form>`);
  const updateTransferCurrencies = changed => {
    const source = state.accounts.find(a => a.id === $('transferFrom').value);
    const destination = state.accounts.find(a => a.id === $('transferTo').value);
    $('transferFromCurrency').textContent = source?.currency || '';
    $('transferToCurrency').textContent = destination?.currency || '';
    if (source && destination && source.currency === destination.currency && (changed || !$('transferReceived').value)) {
      $('transferReceived').value = $('transferAmount').value;
      $('transferReceived').disabled = true;
    } else $('transferReceived').disabled = false;
  };
  $('transferFrom').value = sourceId;
  $('transferTo').value = destinationId;
  $('transferFrom').onchange = () => updateTransferCurrencies(true);
  $('transferTo').onchange = () => updateTransferCurrencies(true);
  $('transferAmount').oninput = () => {
    const source = state.accounts.find(a => a.id === $('transferFrom').value);
    const destination = state.accounts.find(a => a.id === $('transferTo').value);
    if (source?.currency === destination?.currency) $('transferReceived').value = $('transferAmount').value;
  };
  updateTransferCurrencies(false);
  $('transferForm').onsubmit = async event => {
    event.preventDefault();
    const source = state.accounts.find(a => a.id === $('transferFrom').value);
    const destination = state.accounts.find(a => a.id === $('transferTo').value);
    if (!source || !destination || source.id === destination.id) { toast('Choose two different accounts.'); return; }
    const date = $('transferDate').value;
    if (date < source.openingDate || date < destination.openingDate) { toast('Choose a date after both accounts started tracking.'); return; }
    const transaction = {
      id: existing?.id || crypto.randomUUID(), type: 'transfer', amount: +$('transferAmount').value,
      currency: source.currency, category: 'Transfer', paidBy: 'Shared', accountId: source.id, account: source.name,
      toAccountId: destination.id, toAmount: +$('transferReceived').value, debtId: '', debtPrincipal: null,
      debtInterest: 0, recurringItemId: '', recurringMonth: '', date,
      note: $('transferNote').value.trim(), createdAt: existing?.createdAt || new Date().toISOString()
    };
    const index = state.transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) state.transactions[index] = transaction;
    else state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: 'Transfer saved ✓' });
    ensureTodaySnapshot();
  };
}

function editTransaction(id) {
  const transaction = state.transactions.find(t => t.id === id);
  if (!transaction) return;
  if (transaction.type === 'transfer') openTransfer(id);
  else if (transaction.debtId) openDebtPayment(transaction.debtId, id);
  else openTransaction(transaction.type, id);
}

async function deleteTransaction(id) {
  const transaction = state.transactions.find(t => t.id === id);
  if (!transaction || !confirm(`Delete this ${transaction.type === 'transfer' ? 'transfer' : 'record'}?`)) return;
  if (transaction.debtId && transaction.debtPrincipal) {
    const debt = state.debts.find(item => item.id === transaction.debtId);
    if (debt) debt.remaining = Math.min(debt.original, debt.remaining + transaction.debtPrincipal);
  }
  state.transactions = state.transactions.filter(t => t.id !== id);
  await saveOperation({ action: 'delete', table: 'transactions', id }, { close: false, message: 'Record deleted' });
  ensureTodaySnapshot();
}

function openAccountForm(id = null) {
  const account = id ? state.accounts.find(item => item.id === id) : null;
  openModal(account ? 'Edit account' : 'Add bank, cash or wallet', `<form class="form" id="accountForm">
    <div class="friendlyNote">Starting balance means the real balance just before tracking begins. Linked salary, spending and transfers update it after that.${account ? ' Currency stays fixed so older records keep their meaning.' : ''}</div>
    <label>Name<input id="accountName" required maxlength="80" value="${esc(account?.name || '')}" placeholder="Main bank account"></label>
    <div class="fieldRow"><label>Type<select id="accountType"><option value="bank">Bank account</option><option value="cash">Cash</option><option value="wallet">Mobile wallet</option></select></label><label>Currency<select id="accountCurrency"${account ? ' disabled' : ''}>${currencyOptions(account?.currency || state.settings.lastCurrency)}</select></label></div>
    <div class="fieldRow"><label>Starting balance<input id="accountOpening" type="number" step="0.01" required value="${account?.openingBalance ?? 0}"></label><label>Track from<input id="accountDate" type="date" required value="${account?.openingDate || today()}"></label></div>
    <label>Notes<input id="accountNotes" maxlength="200" value="${esc(account?.notes || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">${account ? 'Update account' : 'Add account'}</button>
  </form>`);
  $('accountType').value = account?.type || 'bank';
  $('accountForm').onsubmit = async event => {
    event.preventDefault();
    const name = $('accountName').value.trim();
    if (state.accounts.some(item => item.id !== account?.id && item.name.toLowerCase() === name.toLowerCase())) {
      toast('An account with that name already exists.');
      return;
    }
    const openingDate = $('accountDate').value;
    const earlierLinked = account && state.transactions.some(transaction =>
      (transaction.accountId === account.id || transaction.toAccountId === account.id) && transaction.date < openingDate
    );
    if (earlierLinked) { toast('The tracking date cannot move after an existing linked record.'); return; }
    const item = {
      id: account?.id || crypto.randomUUID(), name, type: $('accountType').value,
      currency: $('accountCurrency').value, openingBalance: +$('accountOpening').value,
      openingDate, notes: $('accountNotes').value.trim(), active: true,
      createdAt: account?.createdAt || new Date().toISOString()
    };
    rememberCurrency(item.currency);
    const index = state.accounts.findIndex(a => a.id === item.id);
    if (index >= 0) state.accounts[index] = item;
    else state.accounts.push(item);
    await saveOperation({ action: 'upsert', table: 'accounts', row: { id: item.id, household_id: householdId, name: item.name, account_type: item.type, currency: item.currency, opening_balance: item.openingBalance, opening_date: item.openingDate, notes: item.notes || null, active: true, updated_at: new Date().toISOString() } }, { message: 'Account saved ✓' });
    ensureTodaySnapshot();
  };
}

function openAccountStatement(id) {
  const account = state.accounts.find(item => item.id === id);
  if (!account) return;
  const records = state.transactions
    .filter(transaction => transaction.date >= account.openingDate && (transaction.accountId === id || transaction.toAccountId === id))
    .sort((a, b) => (a.date + a.createdAt).localeCompare(b.date + b.createdAt));
  let running = account.openingBalance;
  const rows = [{ date: account.openingDate, title: 'Opening balance', delta: null, balance: running }];
  records.forEach(transaction => {
    const delta = accountDeltaNative(account, transaction);
    running += delta;
    rows.push({ date: transaction.date, title: transaction.type === 'transfer' ? (delta < 0 ? `Transfer to ${accountName(transaction.toAccountId)}` : `Transfer from ${accountName(transaction.accountId)}`) : transaction.category, delta, balance: running });
  });
  openModal(`${account.name} statement`, `<div class="friendlyNote">This running balance starts from ${formatDate(account.openingDate)} and updates from every linked entry.</div><div class="statement">${rows.map(row => `<div class="statementRow"><time>${esc(row.date)}</time><div><b>${esc(row.title)}</b>${row.delta == null ? '' : `<div class="meta">${row.delta >= 0 ? '+' : '−'} ${money(Math.abs(row.delta), account.currency)}</div>`}</div><div class="statementValue"><strong>${money(row.balance, account.currency)}</strong><span>balance</span></div></div>`).join('')}</div><button class="secondary wide" onclick="closeModal();reconcileAccount('${account.id}')">Correct to today’s balance</button>`);
}

function reconcileAccount(id) {
  const account = state.accounts.find(item => item.id === id);
  if (!account) return;
  const current = accountBalanceNative(account);
  openModal('Correct account balance', `<form class="form" id="reconcileForm">
    <div class="friendlyNote">The app shows <b>${money(current, account.currency)}</b>. Enter the real bank or wallet balance; the difference will be kept as a clear adjustment in history.</div>
    <label>Actual balance<input id="actualBalance" type="number" step="0.01" required value="${current.toFixed(2)}"></label>
    <button class="primary" type="submit">Update balance</button>
  </form>`);
  $('reconcileForm').onsubmit = async event => {
    event.preventDefault();
    const actual = +$('actualBalance').value;
    const difference = actual - current;
    if (Math.abs(difference) < .005) { closeModal(); toast('Balance already matches ✓'); return; }
    const transaction = {
      id: crypto.randomUUID(), type: difference > 0 ? 'income' : 'expense', amount: Math.abs(difference),
      currency: account.currency, category: 'Balance adjustment', paidBy: 'Shared', accountId: account.id,
      account: account.name, toAccountId: '', toAmount: null, debtId: '', debtPrincipal: null, debtInterest: 0,
      recurringItemId: '', recurringMonth: '', date: today(), note: 'Manual account balance correction', createdAt: new Date().toISOString()
    };
    state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: 'Balance corrected ✓' });
    ensureTodaySnapshot();
  };
}

function currentCheckup() { return state.checkups.find(checkup => checkup.month === monthStart()); }

function monthlyCheckupHtml() {
  const checkup = currentCheckup();
  if (checkup?.balancesCheckedAt) return `<div class="checkupTop"><div class="checkupIcon">✓</div><div><h3>${formatDate(checkup.month, { month: 'long', year: 'numeric' })} checked</h3><p>${checkup.accountCount} account${checkup.accountCount === 1 ? '' : 's'} confirmed${Math.abs(checkup.adjustmentUSD) > .005 ? ` · ${baseMoney(Math.abs(checkup.adjustmentUSD))} corrected` : ' · balances matched'}</p></div><button class="secondary compact" onclick="openMonthlyCheckup()">Check again</button></div>`;
  return `<div class="checkupTop"><div class="checkupIcon">◎</div><div><h3>Monthly money check</h3><p>Confirm the real balances together and finish the month with clean numbers.</p></div><button class="primary compact" onclick="openMonthlyCheckup()">Start</button></div>`;
}

function openMonthlyCheckup() {
  const accounts = activeAccounts();
  if (!accounts.length) {
    openModal('Monthly money check', '<div class="form"><div class="friendlyNote">Add your bank, cash or wallet account first. The check-up compares the app with the real balance.</div><button class="primary" onclick="closeModal();openAccountForm()">Add account</button></div>');
    return;
  }
  const existing = currentCheckup();
  openModal('Monthly money check', `<form id="monthlyCheckupForm" class="form">
    <div class="friendlyNote">Open each bank or wallet and enter the balance you see now. Any difference becomes a visible balance adjustment—nothing is silently changed.</div>
    <div class="checkupInputs">${accounts.map((account, index) => `<label class="checkupAccount"><div><b>${esc(account.name)}</b><span>App shows ${money(accountBalanceNative(account), account.currency)}</span></div><input id="checkupBalance${index}" type="number" step="0.01" required value="${accountBalanceNative(account).toFixed(2)}" aria-label="Actual balance for ${esc(account.name)}"></label>`).join('')}</div>
    <label>One note for this month<textarea id="checkupNote" maxlength="300" placeholder="What went well or needs attention?">${esc(existing?.note || '')}</textarea></label>
    <button class="primary" type="submit">Finish monthly check</button>
  </form>`);
  $('monthlyCheckupForm').onsubmit = async event => {
    event.preventDefault();
    const operations = [];
    let adjustmentUSD = 0;
    accounts.forEach((account, index) => {
      const current = accountBalanceNative(account);
      const actual = +$(`checkupBalance${index}`).value;
      const difference = actual - current;
      if (Math.abs(difference) < .005) return;
      adjustmentUSD += Math.abs(usd(difference, account.currency));
      const transaction = {
        id: crypto.randomUUID(), type: difference > 0 ? 'income' : 'expense', amount: Math.abs(difference),
        currency: account.currency, category: 'Balance adjustment', paidBy: defaultPerson(), accountId: account.id,
        account: account.name, toAccountId: '', toAmount: null, debtId: '', debtPrincipal: null, debtInterest: 0,
        recurringItemId: '', recurringMonth: '', date: today(), note: `Monthly check · ${monthKey()}`, createdAt: new Date().toISOString()
      };
      state.transactions.push(transaction);
      operations.push({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) });
    });
    const checkup = {
      id: existing?.id || crypto.randomUUID(), month: monthStart(), accountCount: accounts.length,
      adjustmentUSD, note: $('checkupNote').value.trim(), completedBy: currentUser.id,
      focus: existing?.focus || '', closedAt: existing?.closedAt || '', balancesCheckedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    const index = state.checkups.findIndex(item => item.id === checkup.id);
    if (index >= 0) state.checkups[index] = checkup;
    else state.checkups.push(checkup);
    operations.push({ action: 'checkup', row: {
      id: checkup.id, household_id: householdId, month: checkup.month, completed_by: currentUser.id,
      account_count: checkup.accountCount, adjustment_total_usd: checkup.adjustmentUSD,
      note: checkup.note || null, focus: checkup.focus || null, closed_at: checkup.closedAt || null, balances_checked_at: checkup.balancesCheckedAt,
      completed_at: checkup.completedAt, updated_at: checkup.updatedAt
    } });
    await saveOperations(operations, { message: 'Monthly check complete ✓', celebrate: true });
    ensureTodaySnapshot();
  };
}

async function archiveAccount(id) {
  const account = state.accounts.find(item => item.id === id);
  if (!account) return;
  if (Math.abs(accountBalanceNative(account)) >= .005) {
    toast('Transfer or correct this account to zero before archiving.');
    return;
  }
  if (!confirm(`Archive ${account.name}? Its history will stay available in Timeline.`)) return;
  account.active = false;
  await saveOperation({ action: 'upsert', table: 'accounts', row: { id: account.id, household_id: householdId, name: account.name, account_type: account.type, currency: account.currency, opening_balance: account.openingBalance, opening_date: account.openingDate, notes: account.notes || null, active: false, updated_at: new Date().toISOString() } }, { close: false, message: 'Account archived' });
  ensureTodaySnapshot();
}

function openAssetForm(id = null) {
  const asset = id ? state.assets.find(item => item.id === id) : null;
  openModal(asset ? 'Edit asset' : 'Add other asset', `<form class="form" id="assetForm">
    <div class="friendlyNote">Use this for gold, investments, crypto or property. Bank and cash balances belong in Accounts so they are never counted twice.</div>
    <label>Name<input id="assetName" required maxlength="100" value="${esc(asset?.name || '')}" placeholder="Gold jewellery / Investment / Property"></label>
    <label>Type<select id="assetType">${asset?.type === 'cash' ? '<option value="cash">Legacy cash balance</option>' : ''}<option value="manual">Other asset / investment</option><option value="metal">Precious metal</option><option value="crypto">Crypto</option></select></label>
    <div id="assetSymbolWrap" class="hidden"><label>Asset<select id="assetSymbol"></select></label></div>
    <label id="assetQuantityLabel">Amount / quantity<input id="assetQuantity" type="number" step="0.00000001" min="0" value="${asset?.quantity ?? ''}"></label>
    <label id="assetCurrencyWrap">Currency<select id="assetCurrency">${currencyOptions(asset?.currency || state.settings.lastCurrency)}</select></label>
    <label id="assetManualWrap" class="hidden">Current total value<input id="assetManualValue" type="number" step="0.01" min="0" value="${asset?.manualValue ?? ''}"></label>
    <label>Notes<input id="assetNotes" maxlength="200" value="${esc(asset?.notes || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save asset</button>
  </form>`);
  $('assetType').value = asset?.type || 'manual';
  $('assetType').onchange = () => configureAssetForm();
  configureAssetForm(asset?.symbol || '');
  $('assetForm').onsubmit = async event => {
    event.preventDefault();
    const type = $('assetType').value;
    const item = {
      id: asset?.id || crypto.randomUUID(), name: $('assetName').value.trim(), type,
      symbol: ['metal', 'crypto'].includes(type) ? $('assetSymbol').value : '',
      quantity: +$('assetQuantity').value || 0, currency: ['metal', 'crypto'].includes(type) ? 'USD' : $('assetCurrency').value,
      manualValue: type === 'manual' ? +$('assetManualValue').value : null,
      notes: $('assetNotes').value.trim(), createdAt: asset?.createdAt || new Date().toISOString()
    };
    if (type !== 'manual' && !(item.quantity > 0)) { toast('Enter an amount or quantity greater than zero.'); return; }
    if (type === 'manual' && !(item.manualValue >= 0)) { toast('Enter the current value.'); return; }
    if (!['metal', 'crypto'].includes(type)) rememberCurrency(item.currency);
    const index = state.assets.findIndex(a => a.id === item.id);
    if (index >= 0) state.assets[index] = item;
    else state.assets.push(item);
    await saveOperation({ action: 'upsert', table: 'assets', row: { id: item.id, household_id: householdId, user_id: currentUser.id, name: item.name, asset_type: item.type, symbol: item.symbol || null, quantity: item.quantity, currency: item.currency, manual_value: item.manualValue, notes: item.notes || null, updated_at: new Date().toISOString() } }, { message: 'Asset saved ✓' });
    await refreshPrices(true);
    ensureTodaySnapshot();
  };
}

function configureAssetForm(selected = '') {
  const type = $('assetType').value;
  const market = ['metal', 'crypto'].includes(type);
  $('assetSymbolWrap').classList.toggle('hidden', !market);
  $('assetCurrencyWrap').classList.toggle('hidden', market);
  $('assetManualWrap').classList.toggle('hidden', type !== 'manual');
  const quantityLabel = $('assetQuantityLabel');
  if (type === 'metal') {
    $('assetSymbol').innerHTML = METALS.map(([symbol, name]) => `<option value="${symbol}">${name} (${symbol})</option>`).join('');
    quantityLabel.childNodes[0].nodeValue = 'Weight in grams';
  } else if (type === 'crypto') {
    $('assetSymbol').innerHTML = CRYPTO.map(([symbol, name]) => `<option value="${symbol}">${name} (${symbol})</option>`).join('');
    quantityLabel.childNodes[0].nodeValue = 'Coin quantity';
  } else if (type === 'cash') quantityLabel.childNodes[0].nodeValue = 'Balance';
  else quantityLabel.childNodes[0].nodeValue = 'Quantity (optional reference)';
  if (selected && market) $('assetSymbol').value = selected;
}

async function deleteAsset(id) {
  const asset = state.assets.find(item => item.id === id);
  if (!asset || !confirm(`Delete ${asset.name}?`)) return;
  state.assets = state.assets.filter(item => item.id !== id);
  await saveOperation({ action: 'delete', table: 'assets', id }, { close: false, message: 'Asset deleted' });
  ensureTodaySnapshot();
}

function openDebtForm(id = null) {
  const debt = id ? state.debts.find(item => item.id === id) : null;
  openModal(debt ? 'Edit debt' : 'Add debt', `<form class="form" id="debtForm">
    <label>Name<input id="debtName" required maxlength="100" value="${esc(debt?.name || '')}" placeholder="Credit card / Loan"></label>
    <div class="fieldRow"><label>Original amount<input id="debtOriginal" type="number" min="0" step="0.01" required value="${debt?.original ?? ''}"></label><label>Remaining now<input id="debtRemaining" type="number" min="0" step="0.01" required value="${debt?.remaining ?? ''}"></label></div>
    <label>Currency<select id="debtCurrency"${debt ? ' disabled' : ''}>${currencyOptions(debt?.currency || state.settings.lastCurrency)}</select></label>
    <div class="fieldRow"><label>Annual interest %<input id="debtApr" type="number" min="0" max="100" step="0.001" value="${debt?.apr ?? 0}"></label><label>Minimum monthly payment<input id="debtMinimum" type="number" min="0" step="0.01" value="${debt?.minimum ?? 0}"></label></div>
    <div class="fieldRow"><label>Usual payment day<input id="debtPaymentDay" type="number" min="1" max="31" value="${debt?.paymentDay || ''}" placeholder="Optional"></label><label>Target payoff date<input id="debtDue" type="date" value="${debt?.due || ''}"></label></div>
    <div class="warningNote">Use “Make payment” after this is saved. A linked payment reduces the remaining balance automatically and keeps the history accurate.${debt ? ' Currency stays fixed to protect payment history.' : ''}</div>
    <button class="primary" type="submit">Save debt</button>
  </form>`);
  $('debtForm').onsubmit = async event => {
    event.preventDefault();
    const original = +$('debtOriginal').value;
    const remaining = +$('debtRemaining').value;
    if (remaining > original) { toast('Remaining balance cannot exceed the original amount.'); return; }
    const item = {
      id: debt?.id || crypto.randomUUID(), name: $('debtName').value.trim(), original, remaining,
      currency: $('debtCurrency').value, due: $('debtDue').value, apr: +$('debtApr').value || 0,
      minimum: +$('debtMinimum').value || 0, paymentDay: +$('debtPaymentDay').value || null,
      active: true, createdAt: debt?.createdAt || new Date().toISOString()
    };
    rememberCurrency(item.currency);
    const index = state.debts.findIndex(d => d.id === item.id);
    if (index >= 0) state.debts[index] = item;
    else state.debts.push(item);
    await saveOperation({ action: 'upsert', table: 'debts', row: { id: item.id, household_id: householdId, name: item.name, original_amount: item.original, remaining_amount: item.remaining, currency: item.currency, due_date: item.due || null, annual_interest_rate: item.apr, minimum_payment: item.minimum, payment_day: item.paymentDay, active: true } }, { message: 'Debt plan saved ✓' });
    ensureTodaySnapshot();
  };
}

function openDebtPayment(debtId, transactionId = null, preset = {}) {
  const existing = transactionId ? state.transactions.find(t => t.id === transactionId) : null;
  const debt = state.debts.find(item => item.id === (existing?.debtId || debtId));
  const accounts = activeAccounts();
  if (!debt) return;
  if (!accounts.length) {
    openModal('Make debt payment', `<div class="form"><div class="friendlyNote">Add the bank or cash account the payment leaves from first. That keeps both your debt and account balance correct.</div><button class="primary" onclick="closeModal();openAccountForm()">Add account</button></div>`);
    return;
  }
  const selectedAccount = existing?.accountId || accounts.find(a => a.currency === debt.currency)?.id || accounts[0].id;
  const maxPrincipal = debt.remaining + Number(existing?.debtPrincipal || 0);
  const suggestedPaymentUSD = Number(preset.paymentUSD || 0);
  const suggestedInterestUSD = Math.min(suggestedPaymentUSD, usd(debt.remaining, debt.currency) * Number(debt.apr || 0) / 1200);
  const suggestedPrincipal = Math.min(maxPrincipal, fromUSD(Math.max(0, suggestedPaymentUSD - suggestedInterestUSD), debt.currency));
  const suggestedInterest = fromUSD(suggestedInterestUSD, debt.currency);
  const suggestedAccountTotal = fromUSD(suggestedPaymentUSD, accounts.find(account => account.id === selectedAccount)?.currency || debt.currency);
  openModal(existing ? 'Edit debt payment' : `Pay ${debt.name}`, `<form class="form" id="debtPaymentForm">
    <div class="friendlyNote">Principal reduces the debt. Interest is recorded but does not reduce it. The total leaving the selected account updates its balance.</div>
    <label>Pay from<select id="debtPaymentAccount">${accountSelectOptions(selectedAccount, false)}</select></label>
    <label>Total leaving account <span id="debtAccountCurrency"></span><input id="debtPaymentTotal" type="number" min="0.01" step="0.01" required value="${existing?.amount ?? (suggestedPaymentUSD > 0 ? suggestedAccountTotal.toFixed(2) : '')}"></label>
    <div class="fieldRow"><label>Principal <span>${debt.currency}</span><input id="debtPaymentPrincipal" type="number" min="0.01" max="${maxPrincipal}" step="0.01" required value="${existing?.debtPrincipal ?? (suggestedPaymentUSD > 0 ? suggestedPrincipal.toFixed(2) : '')}"></label><label>Interest / fees <span>${debt.currency}</span><input id="debtPaymentInterest" type="number" min="0" step="0.01" value="${existing?.debtInterest ?? (suggestedPaymentUSD > 0 ? suggestedInterest.toFixed(2) : 0)}"></label></div>
    <div id="debtPaymentHint" class="friendlyNote"></div>
    <label>Date<input id="debtPaymentDate" type="date" required value="${existing?.date || today()}"></label>
    <label>Note<input id="debtPaymentNote" maxlength="200" value="${esc(existing?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save payment</button>
  </form>`);
  $('debtPaymentAccount').value = selectedAccount;
  const syncDebtPayment = source => {
    const account = state.accounts.find(a => a.id === $('debtPaymentAccount').value);
    $('debtAccountCurrency').textContent = account?.currency || '';
    const sameCurrency = account?.currency === debt.currency;
    $('debtPaymentHint').textContent = sameCurrency
      ? 'Same currency: principal + interest must equal the total leaving the account.'
      : `Cross-currency payment: enter the exact ${account?.currency || ''} debited and the exact ${debt.currency} principal shown by the lender.`;
    if (sameCurrency && source === 'total') {
      $('debtPaymentPrincipal').value = Math.max(0, +$('debtPaymentTotal').value - (+$('debtPaymentInterest').value || 0)).toFixed(2);
    }
  };
  $('debtPaymentAccount').onchange = () => syncDebtPayment('account');
  $('debtPaymentTotal').oninput = () => syncDebtPayment('total');
  $('debtPaymentInterest').oninput = () => syncDebtPayment('total');
  syncDebtPayment('account');
  $('debtPaymentForm').onsubmit = async event => {
    event.preventDefault();
    const account = state.accounts.find(a => a.id === $('debtPaymentAccount').value);
    const total = +$('debtPaymentTotal').value;
    const principal = +$('debtPaymentPrincipal').value;
    const interest = +$('debtPaymentInterest').value || 0;
    if (!account) return;
    if (principal > maxPrincipal + .005) { toast(`Principal cannot exceed ${money(maxPrincipal, debt.currency)}.`); return; }
    if (account.currency === debt.currency && Math.abs(total - principal - interest) > .01) {
      toast('For the same currency, total must equal principal plus interest.');
      return;
    }
    const date = $('debtPaymentDate').value;
    if (date < account.openingDate) { toast(`Choose ${account.openingDate} or later for this account.`); return; }
    if (existing?.debtId && existing.debtPrincipal) {
      const oldDebt = state.debts.find(item => item.id === existing.debtId);
      if (oldDebt) oldDebt.remaining = Math.min(oldDebt.original, oldDebt.remaining + existing.debtPrincipal);
    }
    debt.remaining = Math.max(0, debt.remaining - principal);
    const transaction = {
      id: existing?.id || crypto.randomUUID(), type: 'expense', amount: total, currency: account.currency,
      category: 'Debt', paidBy: defaultPerson(),
      accountId: account.id, account: account.name, toAccountId: '', toAmount: null, debtId: debt.id,
      debtPrincipal: principal, debtInterest: interest, recurringItemId: '', recurringMonth: '', date,
      note: $('debtPaymentNote').value.trim(), createdAt: existing?.createdAt || new Date().toISOString()
    };
    const index = state.transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) state.transactions[index] = transaction;
    else state.transactions.push(transaction);
    await saveOperation({ action: 'upsert', table: 'transactions', row: transactionRow(transaction) }, { message: `${money(principal, debt.currency)} knocked off debt ✓`, celebrate: true });
    ensureTodaySnapshot();
  };
}

async function archiveDebt(id) {
  const debt = state.debts.find(item => item.id === id);
  if (!debt) return;
  if (debt.remaining > .005) { toast('Only a cleared debt can be archived.'); return; }
  if (!confirm(`Archive ${debt.name}? Its payment history will remain.`)) return;
  debt.active = false;
  await saveOperation({ action: 'upsert', table: 'debts', row: { id: debt.id, household_id: householdId, name: debt.name, original_amount: debt.original, remaining_amount: debt.remaining, currency: debt.currency, due_date: debt.due || null, annual_interest_rate: debt.apr, minimum_payment: debt.minimum, payment_day: debt.paymentDay, active: false } }, { close: false, message: 'Debt archived · well done!' });
}

function openGoalForm(id = null, preset = {}) {
  const goal = id ? state.goals.find(item => item.id === id) : null;
  openModal(goal ? 'Edit goal' : 'Add savings goal', `<form class="form" id="goalForm">
    <label>Name<input id="goalName" required maxlength="100" value="${esc(goal?.name || preset.name || '')}" placeholder="Emergency fund / Vacation"></label>
    <div class="fieldRow"><label>Target amount<input id="goalTarget" type="number" min="0.01" step="0.01" required value="${goal?.target ?? preset.target ?? ''}"></label><label>Currency<select id="goalCurrency"${goal ? ' disabled' : ''}>${currencyOptions(goal?.currency || preset.currency || state.settings.lastCurrency)}</select></label></div>
    ${goal ? `<div class="friendlyNote">Already reserved: <b>${money(goal.saved, goal.currency)}</b>. Use “Add saving” on the goal card so every change has a date and history. Currency stays fixed to protect that history.</div>` : `<label>Already saved (optional)<input id="goalStarting" type="number" min="0" step="0.01" value="${preset.saved || 0}"></label>`}
    <label>Target date<input id="goalDue" type="date" value="${goal?.due || preset.due || ''}"></label>
    <button class="primary" type="submit">Save goal</button>
  </form>`);
  $('goalForm').onsubmit = async event => {
    event.preventDefault();
    const item = {
      id: goal?.id || crypto.randomUUID(), name: $('goalName').value.trim(), target: +$('goalTarget').value,
      saved: goal ? goal.saved : +$('goalStarting').value || 0, currency: $('goalCurrency').value,
      due: $('goalDue').value, active: true, createdAt: goal?.createdAt || new Date().toISOString()
    };
    const metrics = moneyMetrics();
    if (!goal && usd(item.saved, item.currency) > Math.max(0, metrics.cashUSD - metrics.goalSavedUSD) + .005) {
      toast('Add or correct the account holding this saving first.');
      return;
    }
    if (item.saved > item.target && !confirm('Saved is above the target. Keep it anyway?')) return;
    rememberCurrency(item.currency);
    const index = state.goals.findIndex(g => g.id === item.id);
    if (index >= 0) state.goals[index] = item;
    else state.goals.push(item);
    await saveOperation({ action: 'upsert', table: 'goals', row: { id: item.id, household_id: householdId, name: item.name, target: item.target, saved: item.saved, currency: item.currency, due_date: item.due || null, active: true } }, { message: 'Goal saved ✓', celebrate: !goal });
  };
}

function createEmergencyGoal() {
  const essentialsUSD = Object.entries(state.budgets).filter(([category]) => ESSENTIAL_CATEGORIES.includes(category)).reduce((sum, [, budget]) => sum + usd(budget.amount, budget.currency), 0);
  openGoalForm(null, { name: 'Emergency Fund', target: Math.round(fromUSD(essentialsUSD * 3, state.settings.base) * 100) / 100, currency: state.settings.base });
}

function openGoalContribution(goalId, contributionId = null, preset = {}) {
  const goal = state.goals.find(item => item.id === goalId);
  const existing = contributionId ? state.contributions.find(item => item.id === contributionId) : null;
  if (!goal) return;
  const suggestedAmount = Math.min(Math.max(0, goal.target - goal.saved), fromUSD(Number(preset.amountUSD || 0), goal.currency));
  const suggestedAccount = activeAccounts().find(account => account.currency === goal.currency)?.id || '';
  openModal(existing ? 'Edit goal saving' : `Add to ${goal.name}`, `<form class="form" id="goalContributionForm">
    <div class="friendlyNote">This reserves money already held in an account. It does not create extra cash or double-count net worth.</div>
    <label>Amount ${goal.currency}<input id="goalContributionAmount" type="number" min="0.01" step="0.01" required value="${existing?.amount ?? (suggestedAmount > 0 ? suggestedAmount.toFixed(2) : '')}"></label>
    <label>Where is it held? <select id="goalContributionAccount"><option value="">Not assigned to one account</option>${activeAccounts().map(account => `<option value="${account.id}">${esc(account.name)} · ${account.currency}</option>`).join('')}</select></label>
    <label>Date<input id="goalContributionDate" type="date" required value="${existing?.date || today()}"></label>
    <label>Note<input id="goalContributionNote" maxlength="200" value="${esc(existing?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save contribution</button>
  </form>`);
  $('goalContributionAccount').value = existing?.accountId || suggestedAccount;
  $('goalContributionForm').onsubmit = async event => {
    event.preventDefault();
    const amount = +$('goalContributionAmount').value;
    const metrics = moneyMetrics();
    const existingUSD = existing ? usd(existing.amount, existing.currency) : 0;
    const availableToReserveUSD = Math.max(0, metrics.cashUSD - (metrics.goalSavedUSD - existingUSD));
    if (usd(amount, goal.currency) > availableToReserveUSD + .005) {
      toast(`Only ${baseMoney(availableToReserveUSD)} is currently free to reserve.`);
      return;
    }
    if (existing) goal.saved = Math.max(0, goal.saved - existing.amount);
    goal.saved += amount;
    const item = {
      id: existing?.id || crypto.randomUUID(), goalId: goal.id,
      accountId: $('goalContributionAccount').value, amount, currency: goal.currency,
      date: $('goalContributionDate').value, note: $('goalContributionNote').value.trim(),
      createdAt: existing?.createdAt || new Date().toISOString()
    };
    const index = state.contributions.findIndex(c => c.id === item.id);
    if (index >= 0) state.contributions[index] = item;
    else state.contributions.push(item);
    await saveOperation({ action: 'upsert', table: 'goal_contributions', row: { id: item.id, household_id: householdId, goal_id: item.goalId, account_id: item.accountId || null, user_id: currentUser.id, amount: item.amount, currency: item.currency, date: item.date, note: item.note || null } }, { message: `${money(amount, goal.currency)} closer to ${goal.name} ✓`, celebrate: true });
  };
}

function openGoalHistory(goalId) {
  const goal = state.goals.find(item => item.id === goalId);
  if (!goal) return;
  const contributions = state.contributions.filter(item => item.goalId === goalId).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
  openModal(`${goal.name} history`, `<div class="friendlyNote">Current reserved total: <b>${money(goal.saved, goal.currency)}</b>. Starting savings are included in the total even if they predate this history.</div>${contributions.length ? `<div class="statement">${contributions.map(item => `<div class="statementRow"><time>${esc(item.date)}</time><div><b>${esc(item.note || 'Goal saving')}</b><div class="meta">${esc(accountName(item.accountId) || 'No account assigned')}</div><div class="cardActions"><button class="linkBtn" onclick="openGoalContribution('${goal.id}','${item.id}')">Edit</button><button class="dangerLink" onclick="deleteGoalContribution('${item.id}')">Delete</button></div></div><div class="statementValue"><strong>+ ${money(item.amount, item.currency)}</strong><span>reserved</span></div></div>`).join('')}</div>` : '<div class="card hint" style="margin-top:12px">No dated contributions yet.</div>'}<button class="primary wide" style="margin-top:12px" onclick="openGoalContribution('${goal.id}')">＋ Add saving</button>`);
}

async function deleteGoalContribution(id) {
  const contribution = state.contributions.find(item => item.id === id);
  if (!contribution || !confirm('Delete this goal contribution?')) return;
  const goal = state.goals.find(item => item.id === contribution.goalId);
  if (goal) goal.saved = Math.max(0, goal.saved - contribution.amount);
  state.contributions = state.contributions.filter(item => item.id !== id);
  await saveOperation({ action: 'delete', table: 'goal_contributions', id }, { close: false, message: 'Contribution deleted' });
}

async function archiveGoal(id) {
  const goal = state.goals.find(item => item.id === id);
  if (!goal || !confirm(`Archive ${goal.name}? Reserved money will return to spendable cash, while its history remains.`)) return;
  goal.active = false;
  await saveOperation({ action: 'upsert', table: 'goals', row: { id: goal.id, household_id: householdId, name: goal.name, target: goal.target, saved: goal.saved, currency: goal.currency, due_date: goal.due || null, active: false } }, { close: false, message: 'Goal archived' });
}

function openRecurringForm(id = null) {
  const item = id ? state.recurring.find(entry => entry.id === id) : null;
  const kind = item?.kind || 'expense';
  openModal(item ? 'Edit regular item' : 'Add regular item', `<form class="form" id="recurringForm">
    <div class="friendlyNote">Set this up once. Each month, tap Confirm on Today to create the real dated entry.</div>
    <label>Name<input id="recurringName" required maxlength="80" value="${esc(item?.name || '')}" placeholder="Salary / Rent / Internet"></label>
    <div class="fieldRow"><label>Type<select id="recurringKind"><option value="income">Income</option><option value="expense">Expense</option></select></label><label>Day each month<input id="recurringDay" type="number" min="1" max="31" required value="${item?.day || 1}"></label></div>
    <div class="fieldRow"><label>Amount<input id="recurringAmount" type="number" min="0.01" step="0.01" required value="${item?.amount ?? ''}"></label><label>Currency<select id="recurringCurrency">${currencyOptions(item?.currency || state.settings.lastCurrency)}</select></label></div>
    <label>Category<select id="recurringCategory"></select></label>
    <label>Account<select id="recurringAccount">${accountSelectOptions(item?.accountId || '')}</select></label>
    <label>Paid / received by<select id="recurringPaidBy">${peopleOptions(item?.paidBy || 'Shared')}</select></label>
    <label>Note<input id="recurringNote" maxlength="200" value="${esc(item?.note || '')}" placeholder="Optional"></label>
    <button class="primary" type="submit">Save monthly item</button>
  </form>`);
  $('recurringKind').value = kind;
  $('recurringPaidBy').value = item?.paidBy || 'Shared';
  $('recurringAccount').value = item?.accountId || '';
  const configureRecurring = () => {
    const currentKind = $('recurringKind').value;
    const categories = currentKind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES.map(([category]) => category);
    const selected = item?.category && (item.kind === currentKind) ? item.category : currentKind === 'income' ? 'Salary' : 'Bills';
    $('recurringCategory').innerHTML = categories.map(category => `<option>${esc(category)}</option>`).join('');
    $('recurringCategory').value = selected;
  };
  const syncRecurringCurrency = () => {
    const account = state.accounts.find(a => a.id === $('recurringAccount').value);
    $('recurringCurrency').disabled = !!account;
    if (account) $('recurringCurrency').value = account.currency;
  };
  $('recurringKind').onchange = configureRecurring;
  $('recurringAccount').onchange = syncRecurringCurrency;
  configureRecurring();
  syncRecurringCurrency();
  $('recurringForm').onsubmit = async event => {
    event.preventDefault();
    const account = state.accounts.find(a => a.id === $('recurringAccount').value);
    const recurringItem = {
      id: item?.id || crypto.randomUUID(), name: $('recurringName').value.trim(), kind: $('recurringKind').value,
      amount: +$('recurringAmount').value, currency: account?.currency || $('recurringCurrency').value,
      category: $('recurringCategory').value, paidBy: $('recurringPaidBy').value, accountId: account?.id || '',
      day: +$('recurringDay').value, note: $('recurringNote').value.trim(), active: true,
      createdAt: item?.createdAt || new Date().toISOString()
    };
    rememberCurrency(recurringItem.currency);
    const index = state.recurring.findIndex(entry => entry.id === recurringItem.id);
    if (index >= 0) state.recurring[index] = recurringItem;
    else state.recurring.push(recurringItem);
    await saveOperation({ action: 'upsert', table: 'recurring_items', row: { id: recurringItem.id, household_id: householdId, created_by: currentUser.id, name: recurringItem.name, kind: recurringItem.kind, amount: recurringItem.amount, currency: recurringItem.currency, category: recurringItem.category, paid_by: recurringItem.paidBy, account_id: recurringItem.accountId || null, day_of_month: recurringItem.day, note: recurringItem.note || null, active: true } }, { message: 'Monthly checklist updated ✓' });
  };
}

function confirmRecurring(id) {
  const item = state.recurring.find(entry => entry.id === id);
  if (!item) return;
  const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const date = `${monthKey()}-${String(Math.min(item.day, lastDay)).padStart(2, '0')}`;
  openTransaction(item.kind, null, { amount: item.amount, currency: item.currency, category: item.category, paidBy: item.paidBy, accountId: item.accountId, date, note: item.note, recurringItemId: item.id, recurringMonth: monthStart() });
}

async function archiveRecurring(id) {
  const item = state.recurring.find(entry => entry.id === id);
  if (!item || !confirm(`Archive ${item.name}? Past confirmations remain.`)) return;
  item.active = false;
  await saveOperation({ action: 'upsert', table: 'recurring_items', row: { id: item.id, household_id: householdId, created_by: currentUser.id, name: item.name, kind: item.kind, amount: item.amount, currency: item.currency, category: item.category, paid_by: item.paidBy, account_id: item.accountId || null, day_of_month: item.day, note: item.note || null, active: false } }, { close: false, message: 'Regular item archived' });
}

function openBudget() {
  const defaultCategories = ['Housing', 'Food', 'Transport', 'Bills', 'Health', 'Shopping', 'Entertainment', 'Travel', 'Other'];
  const categories = [...new Set([...defaultCategories, ...Object.keys(state.budgets)])];
  openModal('Monthly category budget', `<form class="form" id="budgetForm"><div class="friendlyNote">These limits guide the 40% essentials and 10% wants buckets. Debt and goal targets come directly from income.</div>${categories.map((category, index) => {
    const budget = state.budgets[category] || { amount: 0, currency: state.settings.base };
    return `<div class="fieldRow"><label>${esc(category)}<input id="budgetAmount${index}" type="number" min="0" step="0.01" value="${budget.amount}" required></label><label>Currency<select id="budgetCurrency${index}">${currencyOptions(budget.currency)}</select></label></div>`;
  }).join('')}<button class="primary" type="submit">Save category budget</button></form>`);
  $('budgetForm').onsubmit = async event => {
    event.preventDefault();
    categories.forEach((category, index) => { state.budgets[category] = { amount: +$(`budgetAmount${index}`).value || 0, currency: $(`budgetCurrency${index}`).value }; });
    const rows = Object.entries(state.budgets).map(([category, budget]) => ({ household_id: householdId, category, amount: budget.amount, currency: budget.currency }));
    await saveOperation({ action: 'budget', rows }, { message: 'Budget updated ✓' });
  };
}

function settingsRow() {
  return {
    household_id: householdId, base_currency: state.settings.base, payday_day: state.settings.paydayDay,
    fun_mode: state.settings.funMode, debt_strategy: state.settings.debtStrategy,
    usd_to_aed: state.settings.rates.AED, usd_to_mvr: state.settings.rates.MVR, usd_to_inr: state.settings.rates.INR
  };
}

async function saveSettings() {
  const rates = { USD: 1, AED: +$('rateAED').value, MVR: +$('rateMVR').value, INR: +$('rateINR').value };
  const paydayDay = +$('paydayDay').value || null;
  if (!rates.AED || !rates.MVR || !rates.INR) { toast('Every exchange rate must be greater than zero.'); return; }
  if (paydayDay && (paydayDay < 1 || paydayDay > 31)) { toast('Salary day must be from 1 to 31.'); return; }
  state.settings.base = $('baseCurrency').value;
  state.settings.paydayDay = paydayDay;
  state.settings.rates = rates;
  await saveOperation({ action: 'settings', row: settingsRow() }, { close: false, message: 'Settings synced ✓' });
  ensureTodaySnapshot();
}

const quickExpenseUrl = () => `${location.origin}${location.pathname}?quick=expense`;

function shortcutPanel(platform) {
  if (platform === 'android') {
    return `<div class="steps">
      <div class="step"><span>1</span><div><b>Install Our DHAN</b><p>Open this site in Chrome, use the browser menu and choose Install app or Add to Home screen.</p></div></div>
      <div class="step"><span>2</span><div><b>Long-press its app icon</b><p>Choose “Add spend” for a direct expense form. You can drag that shortcut onto the home screen.</p></div></div>
      <div class="step"><span>3</span><div><b>Pixel option: Quick Tap</b><p>Settings → System → Gestures → Quick Tap → Open app → Our DHAN. The direct home-screen shortcut is still the fastest route to Add Spend.</p></div></div>
    </div>`;
  }
  return `<div class="steps">
    <div class="step"><span>1</span><div><b>Create an Apple Shortcut</b><p>In Shortcuts, create “Log Spend,” add the Open URLs action, and paste the quick link below.</p></div></div>
    <div class="step"><span>2</span><div><b>Choose Back Tap</b><p>Settings → Accessibility → Touch → Back Tap → Double Tap → Log Spend.</p></div></div>
    <div class="step"><span>3</span><div><b>Stay signed in</b><p>A double tap will open the private Add Spend form. The first visit may ask you to sign in.</p></div></div>
  </div>`;
}

function openShortcutHelp(platform = /Android/i.test(navigator.userAgent) ? 'android' : 'iphone') {
  openModal('Fast expense shortcut', `<div class="shortcutTabs"><button id="shortcutIphone" class="${platform === 'iphone' ? 'active' : ''}" onclick="switchShortcutTab('iphone')">iPhone Back Tap</button><button id="shortcutAndroid" class="${platform === 'android' ? 'active' : ''}" onclick="switchShortcutTab('android')">Android</button></div><div id="shortcutPanel">${shortcutPanel(platform)}</div><div class="form" style="margin-top:15px"><label>Direct Add Spend link<input id="quickExpenseLink" readonly value="${esc(quickExpenseUrl())}"></label><div class="buttonRow"><button class="secondary compact" onclick="copyQuickLink()">Copy link</button><button class="primary compact" onclick="shareQuickLink()">Share</button></div><div class="friendlyNote">This uses only the website and your phone’s built-in shortcut features. It stays free and does not use ChatGPT.</div></div>`);
}

function switchShortcutTab(platform) {
  $('shortcutPanel').innerHTML = shortcutPanel(platform);
  $('shortcutIphone').classList.toggle('active', platform === 'iphone');
  $('shortcutAndroid').classList.toggle('active', platform === 'android');
}

async function copyQuickLink() {
  try { await navigator.clipboard.writeText(quickExpenseUrl()); toast('Quick link copied ✓'); }
  catch (_error) { $('quickExpenseLink')?.select(); document.execCommand('copy'); toast('Quick link copied ✓'); }
}

async function shareQuickLink() {
  if (navigator.share) {
    try { await navigator.share({ title: 'Our DHAN · Add Spend', text: 'Quick expense entry for Our DHAN', url: quickExpenseUrl() }); }
    catch (_error) { /* User cancelled. */ }
  } else copyQuickLink();
}

function downloadFile(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBackup(label = '') {
  const backup = { exportedAt: new Date().toISOString(), appVersion: VERSION, household: 'Our DHAN', data: state };
  downloadFile(`our-dhan-${label ? `${label}-` : 'backup-'}${today()}.json`, JSON.stringify(backup, null, 2), 'application/json');
  toast('Complete backup downloaded ✓');
}

function chooseBackupFile() {
  const input = $('backupFile');
  input.value = '';
  input.click();
}

function validateBackupData(data, version) {
  if (!data || typeof data !== 'object') return 'This file has no budget data.';
  if (!(version >= 7 && version <= VERSION)) return `Only Our Budget v7–v8 or Our DHAN v${VERSION} backups can be restored safely.`;
  const arrayKeys = ['transactions', 'goals', 'debts', 'assets', 'accounts', 'recurring', 'contributions', 'snapshots'];
  for (const key of arrayKeys) {
    if (!Array.isArray(data[key])) return `The ${key} section is missing.`;
    if (data[key].length > 5000) return `The ${key} section is unexpectedly large.`;
  }
  for (const key of ['sinkingFunds', 'weeklyReviews']) {
    if (data[key] != null && !Array.isArray(data[key])) return `The ${key} section is invalid.`;
    if ((data[key]?.length || 0) > 5000) return `The ${key} section is unexpectedly large.`;
  }
  const allRecords = arrayKeys.flatMap(key => data[key]);
  if (allRecords.some(item => !item || typeof item !== 'object' || ('id' in item && typeof item.id !== 'string'))) return 'One or more records are invalid.';
  const accountIds = new Set([...state.accounts, ...data.accounts].map(item => item.id));
  const debtIds = new Set([...state.debts, ...data.debts].map(item => item.id));
  const goalIds = new Set([...state.goals, ...data.goals].map(item => item.id));
  const recurringIds = new Set([...state.recurring, ...data.recurring].map(item => item.id));
  const brokenLink = data.transactions.some(item =>
    (item.accountId && !accountIds.has(item.accountId)) || (item.toAccountId && !accountIds.has(item.toAccountId)) ||
    (item.debtId && !debtIds.has(item.debtId)) || (item.recurringItemId && !recurringIds.has(item.recurringItemId))
  ) || data.contributions.some(item => !goalIds.has(item.goalId) || (item.accountId && !accountIds.has(item.accountId)));
  if (brokenLink) return 'This backup contains a link to a missing account, debt, goal or regular item.';
  return '';
}

async function handleBackupFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast('Backup files must be under 5 MB.'); return; }
  try {
    const payload = safeParse(await file.text());
    const version = Number(payload?.appVersion || payload?.data?.version || 0);
    const error = validateBackupData(payload?.data, version);
    if (error) { toast(error); return; }
    pendingRestoreData = normalizeState(payload.data);
    const data = pendingRestoreData;
    openModal('Restore backup', `<div class="form">
      <div class="friendlyNote">A safety copy of today’s data will download first. Restore merges the backup into this household; it does not delete newer records.</div>
      <div class="restorePreview">
        <div><span>Transactions</span><b>${data.transactions.length}</b></div>
        <div><span>Accounts</span><b>${data.accounts.length}</b></div>
        <div><span>Plans</span><b>${data.goals.length + data.debts.length}</b></div>
        <div><span>Regular items</span><b>${data.recurring.length}</b></div>
        <div><span>Assets</span><b>${data.assets.length}</b></div>
        <div><span>Snapshots</span><b>${data.snapshots.length}</b></div>
      </div>
      <div class="warningNote">Keep this page open until the restore finishes. Nothing is restored while offline.</div>
      <button id="restoreConfirm" class="primary" onclick="confirmBackupRestore()">Download safety copy and restore</button>
      <button class="secondary" onclick="pendingRestoreData=null;closeModal()">Cancel</button>
    </div>`);
  } catch (_error) { toast('This backup could not be read.'); }
}

function accountRestoreRow(account) {
  return { id: account.id, household_id: householdId, name: String(account.name || '').trim(), account_type: account.type, currency: cleanCurrency(account.currency), opening_balance: Number(account.openingBalance || 0), opening_date: account.openingDate, notes: account.notes || null, active: account.active !== false, updated_at: new Date().toISOString() };
}
function goalRestoreRow(goal, saved = goal.saved) {
  return { id: goal.id, household_id: householdId, name: String(goal.name || '').trim(), target: Number(goal.target || 0), saved: Number(saved || 0), currency: cleanCurrency(goal.currency), due_date: goal.due || null, active: goal.active !== false, updated_at: new Date().toISOString() };
}
function debtRestoreRow(debt, remaining = debt.remaining) {
  return { id: debt.id, household_id: householdId, name: String(debt.name || '').trim(), original_amount: Number(debt.original || 0), remaining_amount: Number(remaining || 0), currency: cleanCurrency(debt.currency), due_date: debt.due || null, annual_interest_rate: Number(debt.apr || 0), minimum_payment: Number(debt.minimum || 0), payment_day: debt.paymentDay || null, active: debt.active !== false, updated_at: new Date().toISOString() };
}

async function confirmBackupRestore() {
  const data = pendingRestoreData;
  if (!data || !db || !householdId) return;
  if (!navigator.onLine) { toast('Reconnect before restoring a backup.'); return; }
  if (pending().length && !(await flushPending())) { toast('Waiting changes must sync before restore.'); return; }
  const button = $('restoreConfirm');
  if (button) { button.disabled = true; button.textContent = 'Restoring…'; }
  exportBackup('before-restore');
  const operations = [];
  operations.push({ action: 'settings', row: {
    household_id: householdId, base_currency: data.settings.base, payday_day: data.settings.paydayDay,
    fun_mode: data.settings.funMode !== false, debt_strategy: data.settings.debtStrategy,
    usd_to_aed: data.settings.rates.AED, usd_to_mvr: data.settings.rates.MVR, usd_to_inr: data.settings.rates.INR
  } });
  const budgetRows = Object.entries(data.budgets).map(([category, budget]) => ({ household_id: householdId, category, amount: Number(budget.amount || 0), currency: cleanCurrency(budget.currency) }));
  if (budgetRows.length) operations.push({ action: 'budget', rows: budgetRows });
  data.accounts.forEach(account => operations.push({ action: 'upsert', table: 'accounts', row: accountRestoreRow(account) }));
  data.goals.forEach(goal => operations.push({ action: 'upsert', table: 'goals', row: goalRestoreRow(goal, 0) }));
  data.debts.forEach(debt => operations.push({ action: 'upsert', table: 'debts', row: debtRestoreRow(debt, debt.original) }));
  data.recurring.forEach(item => operations.push({ action: 'upsert', table: 'recurring_items', row: {
    id: item.id, household_id: householdId, created_by: currentUser.id, name: item.name, kind: item.kind,
    amount: Number(item.amount), currency: cleanCurrency(item.currency), category: item.category, paid_by: item.paidBy || 'Shared',
    account_id: item.accountId || null, day_of_month: Number(item.day), note: item.note || null, active: item.active !== false, updated_at: new Date().toISOString()
  } }));
  data.transactions.forEach(item => operations.push({ action: 'upsert', table: 'transactions', row: transactionRow({
    id: item.id, type: item.type, amount: Number(item.amount), currency: cleanCurrency(item.currency), category: item.category,
    paidBy: item.paidBy || 'Shared', accountId: item.accountId || '', account: item.account || '', toAccountId: item.toAccountId || '',
    toAmount: item.toAmount == null ? null : Number(item.toAmount), debtId: item.debtId || '', debtPrincipal: item.debtPrincipal == null ? null : Number(item.debtPrincipal),
    debtInterest: Number(item.debtInterest || 0), recurringItemId: item.recurringItemId || '', recurringMonth: item.recurringMonth || '',
    date: item.date, note: item.note || '', createdAt: item.createdAt || new Date().toISOString()
  }) }));
  data.contributions.forEach(item => operations.push({ action: 'upsert', table: 'goal_contributions', row: {
    id: item.id, household_id: householdId, goal_id: item.goalId, account_id: item.accountId || null, user_id: currentUser.id,
    amount: Number(item.amount), currency: cleanCurrency(item.currency), date: item.date, note: item.note || null, updated_at: new Date().toISOString()
  } }));
  data.debts.forEach(debt => operations.push({ action: 'upsert', table: 'debts', row: debtRestoreRow(debt) }));
  data.goals.forEach(goal => operations.push({ action: 'upsert', table: 'goals', row: goalRestoreRow(goal) }));
  data.assets.forEach(item => operations.push({ action: 'upsert', table: 'assets', row: {
    id: item.id, household_id: householdId, user_id: currentUser.id, name: item.name, asset_type: item.type,
    symbol: item.symbol || null, quantity: Number(item.quantity || 0), currency: cleanCurrency(item.currency),
    manual_value: item.manualValue == null ? null : Number(item.manualValue), notes: item.notes || null, updated_at: new Date().toISOString()
  } }));
  data.snapshots.forEach(item => {
    const existing = state.snapshots.find(snapshot => snapshot.date === item.date);
    operations.push({ action: 'snapshot', row: { id: existing?.id || item.id, household_id: householdId, snapshot_date: item.date, cash_usd: Number(item.cashUSD), assets_usd: Number(item.assetsUSD), debt_usd: Number(item.debtUSD), net_worth_usd: Number(item.netWorthUSD) } });
  });
  data.checkups.forEach(item => {
    const existing = state.checkups.find(checkup => checkup.month === item.month);
    operations.push({ action: 'checkup', row: { id: existing?.id || item.id, household_id: householdId, month: item.month, completed_by: currentUser.id, account_count: Number(item.accountCount || 0), adjustment_total_usd: Number(item.adjustmentUSD || 0), note: item.note || null, focus: item.focus || null, closed_at: item.closedAt || null, balances_checked_at: item.balancesCheckedAt || null, completed_at: item.completedAt || new Date().toISOString(), updated_at: new Date().toISOString() } });
  });
  data.sinkingFunds.forEach(item => operations.push({ action: 'upsert', table: 'sinking_funds', row: { id: item.id, household_id: householdId, created_by: currentUser.id, name: item.name, target_amount: Number(item.target), saved_amount: Number(item.saved || 0), currency: cleanCurrency(item.currency), due_date: item.due || null, last_reserved_month: item.lastReservedMonth || null, note: item.note || null, active: item.active !== false, updated_at: new Date().toISOString() } }));
  data.weeklyReviews.forEach(item => operations.push({ action: 'moneyDate', row: { id: item.id, household_id: householdId, week_start: item.weekStart, reviewed_by: currentUser.id, win: item.win || null, next_action: item.nextAction || null, completed_at: item.completedAt || new Date().toISOString(), updated_at: new Date().toISOString() } }));
  try {
    for (const operation of operations) {
      const { error } = await runOperation(operation);
      if (error) throw error;
    }
    pendingRestoreData = null;
    state.settings.lastCurrency = data.settings.lastCurrency;
    state.prices = data.prices;
    cache();
    await loadRemote();
    closeModal();
    toast('Backup restored safely ✓');
    celebrate();
    await ensureTodaySnapshot();
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Retry restore'; }
    toast(`Restore stopped: ${error?.message || 'unknown error'}`);
    await loadRemote();
  }
}

function csvCell(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function exportTransactionsCsv() {
  const headers = ['Date', 'Type', 'Category', 'Amount', 'Currency', 'Paid by', 'From account', 'To account', 'Amount received', 'Debt principal', 'Note'];
  const lines = [headers, ...[...state.transactions].sort((a, b) => a.date.localeCompare(b.date)).map(t => [t.date, t.type, t.category, t.amount, t.currency, t.paidBy, accountName(t.accountId) || t.account, accountName(t.toAccountId), t.toAmount ?? '', t.debtPrincipal ?? '', t.note])];
  downloadFile(`our-dhan-transactions-${today()}.csv`, lines.map(row => row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8');
  toast('Transaction CSV downloaded ✓');
}

async function signOut() {
  if (db) await db.auth.signOut();
  showAuth();
}

$('modal').addEventListener('click', event => { if (event.target === $('modal')) closeModal(); });
$('marathiHelpModal').addEventListener('click', event => { if (event.target === $('marathiHelpModal')) closeMarathiHelp(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('marathiHelpModal').classList.contains('hidden')) { closeMarathiHelp(); return; }
  if (event.key === 'Escape' && !$('modal').classList.contains('hidden')) { closeModal(); return; }
});
const wheelObserver = new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
  if (node.nodeType === Node.ELEMENT_NODE) {
    attachMarathiHelp(node);
    prepareInlineControls(node);
  }
})));
wheelObserver.observe(document.body, { childList: true, subtree: true });
attachMarathiHelp();
prepareInlineControls();
setupFormFlow($('settingsFlow'));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
render();
showPage('today');
boot();
