const states = {
  "Andhra Pradesh": {
    districts: [
      "Alluri Sitharama Raju", "Anakapalli", "Ananthapuramu", "Annamayya", "Bapatla",
      "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur",
      "Kakinada", "Krishna", "Kurnool", "Nandyal", "Nellore", "NTR", "Palnadu",
      "Parvathipuram Manyam", "Prakasam", "Srikakulam", "Sri Sathya Sai", "Tirupati",
      "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"
    ],
    cities: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kakinada",
      "Rajahmundry", "Nellore", "Kurnool", "Kadapa", "Eluru",
      "Ongole", "Machilipatnam", "Vizianagaram", "Anantapur", "Chittoor"
    ]
  },

  "Arunachal Pradesh": {
    districts: [
      "Anjaw", "Changlang", "East Kameng", "East Siang", "Kamle", "Kra Daadi",
      "Kurung Kumey", "Lepa Rada", "Lohit", "Longding", "Lower Dibang Valley",
      "Lower Siang", "Lower Subansiri", "Namsai", "Pakke-Kessang", "Papum Pare",
      "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Dibang Valley", "Upper Siang",
      "Upper Subansiri", "West Kameng", "West Siang", "Keyi Panyor", "Bichom"
    ],
    cities: [
      "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro",
      "Along", "Bomdila", "Tezu", "Namsai", "Roing"
    ]
  },

  "Assam": {
    districts: [
      "Baksa", "Bajali", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo",
      "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara",
      "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Kamrup Metropolitan",
      "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon",
      "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar",
      "Tamulpur", "Tinsukia", "Udalguri", "West Karbi Anglong"
    ],
    cities: [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
      "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "North Lakhimpur",
      "Sivasagar", "Karimganj", "Goalpara", "Kokrajhar"
    ]
  },

  "Bihar": {
    districts: [
      "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur",
      "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad",
      "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura",
      "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia",
      "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi",
      "Siwan", "Supaul", "Vaishali", "West Champaran"
    ],
    cities: [
      "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia",
      "Darbhanga", "Arrah", "Bihar Sharif", "Begusarai", "Katihar",
      "Munger", "Chapra", "Samastipur", "Hajipur", "Sasaram"
    ]
  },

  "Chhattisgarh": {
    districts: [
      "Balod", "Baloda Bazar", "Balrampur-Ramanujganj", "Bastar", "Bemetara", "Bijapur",
      "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Gaurela-Pendra-Marwahi",
      "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Khairagarh-Chhuikhadan-Gandai",
      "Kondagaon", "Korba", "Korea", "Mahasamund", "Manendragarh-Chirmiri-Bharatpur",
      "Mohla-Manpur-Ambagarh Chowki", "Mungeli", "Narayanpur", "Raigarh", "Raipur",
      "Rajnandgaon", "Sarangarh-Bilaigarh", "Sakti", "Sukma", "Surajpur", "Surguja"
    ],
    cities: [
      "Raipur", "Bilaspur", "Durg", "Bhilai", "Korba",
      "Rajnandgaon", "Jagdalpur", "Raigarh", "Ambikapur", "Dhamtari"
    ]
  },

  "Goa": {
    districts: ["North Goa", "South Goa"],
    cities: [
      "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda",
      "Bicholim", "Curchorem", "Canacona"
    ]
  },

  "Gujarat": {
    districts: [
      "Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar",
      "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhumi Dwarka", "Gandhinagar",
      "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana",
      "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot",
      "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad", "Vav-Tharad"
    ],
    cities: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
      "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Navsari",
      "Morbi", "Bharuch", "Mehsana", "Surendranagar", "Porbandar"
    ]
  },

  "Haryana": {
    districts: [
      "Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram",
      "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh",
      "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat",
      "Yamunanagar"
    ],
    cities: [
      "Faridabad", "Gurugram", "Panipat", "Ambala", "Hisar",
      "Rohtak", "Karnal", "Sonipat", "Panchkula", "Yamunanagar",
      "Bhiwani", "Sirsa", "Rewari", "Kaithal", "Kurukshetra"
    ]
  },

  "Himachal Pradesh": {
    districts: [
      "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti",
      "Mandi", "Shimla", "Sirmaur", "Solan", "Una"
    ],
    cities: [
      "Shimla", "Dharamsala", "Mandi", "Solan", "Manali",
      "Kullu", "Palampur", "Baddi", "Nahan", "Sundarnagar"
    ]
  },

  "Jharkhand": {
    districts: [
      "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa",
      "Giridih", "Godda", "Gumla", "Hazaribag", "Jamtara", "Khunti", "Koderma",
      "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahibganj",
      "Seraikela-Kharsawan", "Simdega", "West Singhbhum"
    ],
    cities: [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar",
      "Hazaribag", "Giridih", "Dumka", "Phusro", "Chirkunda"
    ]
  },

  "Karnataka": {
    districts: [
      "Bagalkot", "Ballari", "Belagavi", "Bangalore Rural", "Bangalore Urban", "Bidar",
      "Chamarajanagar", "Chikkaballapur", "Chikmagalur", "Chitradurga", "Dakshina Kannada",
      "Davanagere", "Dharwad", "Gadag", "Kalaburagi", "Hassan", "Haveri", "Kodagu",
      "Kolar", "Koppal", "Mandya", "Mysore", "Raichur", "Ramanagara", "Shimoga",
      "Tumakuru", "Udupi", "Uttara Kannada", "Vijayanagara", "Bijapur", "Yadgir"
    ],
    cities: [
      "Bengaluru", "Mysuru", "Hubballi", "Dharwad", "Mangaluru",
      "Belagavi", "Kalaburagi", "Davanagere", "Ballari", "Vijayapura",
      "Shivamogga", "Tumakuru", "Udupi", "Bidar", "Hassan"
    ]
  },

  "Kerala": {
    districts: [
      "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
      "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram",
      "Thrissur", "Wayanad"
    ],
    cities: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam",
      "Palakkad", "Alappuzha", "Kottayam", "Kannur", "Malappuram",
      "Manjeri", "Thalassery", "Kasaragod", "Pathanamthitta"
    ]
  },

  "Madhya Pradesh": {
    districts: [
      "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani",
      "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh",
      "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad",
      "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Maihar",
      "Mandla", "Mandsaur", "Mauganj", "Morena", "Narsinghpur", "Neemuch", "Niwari",
      "Panna", "Pandhurna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna",
      "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi",
      "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"
    ],
    cities: [
      "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain",
      "Sagar", "Dewas", "Satna", "Rewa", "Chhindwara",
      "Ratlam", "Burhanpur", "Khandwa", "Singrauli", "Morena"
    ]
  },

  "Maharashtra": {
    districts: [
      "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana",
      "Chandrapur", "Osmanabad", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon",
      "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nanded",
      "Nandurbar", "Nagpur", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad",
      "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha",
      "Washim", "Yavatmal"
    ],
    cities: [
      "Mumbai", "Pune", "Nagpur", "Nashik", "Thane",
      "Aurangabad", "Solapur", "Amravati", "Kolhapur", "Nanded",
      "Sangli", "Malegaon", "Akola", "Latur", "Dhule",
      "Ahmednagar", "Chandrapur", "Parbhani", "Jalgaon", "Bhiwandi"
    ]
  },

  "Manipur": {
    districts: [
      "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam",
      "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong",
      "Tengnoupal", "Thoubal", "Ukhrul"
    ],
    cities: [
      "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching",
      "Senapati", "Ukhrul", "Jiribam"
    ]
  },

  "Meghalaya": {
    districts: [
      "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "Eastern West Khasi Hills",
      "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills",
      "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
    ],
    cities: [
      "Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar",
      "Resubelpara", "Baghmara", "Cherrapunjee"
    ]
  },

  "Mizoram": {
    districts: [
      "Aizawl", "Champhai", "Hnahthial", "Khawzawl", "Kolasib", "Lawngtlai", "Lunglei",
      "Mamit", "Saiha", "Saitual", "Serchhip"
    ],
    cities: [
      "Aizawl", "Lunglei", "Champhai", "Saiha", "Kolasib",
      "Serchhip", "Lawngtlai", "Mamit"
    ]
  },

  "Nagaland": {
    districts: [
      "Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon",
      "Niuland", "Noklak", "Peren", "Phek", "Shamator", "Tseminyü", "Tuensang", "Wokha",
      "Zunheboto"
    ],
    cities: [
      "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha",
      "Zunheboto", "Mon", "Phek"
    ]
  },

  "Odisha": {
    districts: [
      "Angul", "Boudh", "Bhadrak", "Balangir", "Bargarh", "Balasore", "Cuttack",
      "Debagarh", "Dhenkanal", "Ganjam", "Gajapati", "Jharsuguda", "Jajpur",
      "Jagatsinghpur", "Khordha", "Kendujhar", "Kalahandi", "Kandhamal", "Koraput",
      "Kendrapara", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nuapada", "Nayagarh",
      "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"
    ],
    cities: [
      "Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur",
      "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda",
      "Bargarh", "Angul", "Dhenkanal", "Kendrapara"
    ]
  },

  "Punjab": {
    districts: [
      "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka",
      "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana",
      "Malerkotla", "Mansa", "Moga", "Pathankot", "Patiala", "Rupnagar",
      "Sahibzada Ajit Singh Nagar", "Sangrur", "Shahid Bhagat Singh Nagar",
      "Sri Muktsar Sahib", "Tarn Taran"
    ],
    cities: [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
      "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Firozpur",
      "Gurdaspur", "Sangrur", "Faridkot", "Rupnagar", "Malerkotla"
    ]
  },

  "Rajasthan": {
    districts: [
      "Ajmer", "Alwar", "Balotra", "Banswara", "Baran", "Barmer", "Beawar", "Bharatpur",
      "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Deeg", "Dholpur",
      "Didwana Kuchaman", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore",
      "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Khairthal-Tijara", "Kota",
      "Kotputli-Behror", "Nagaur", "Pali", "Phalodi", "Pratapgarh", "Rajsamand",
      "Salumbar", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"
    ],
    cities: [
      "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
      "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
      "Sri Ganganagar", "Barmer", "Jhunjhunu", "Pali", "Chittorgarh"
    ]
  },

  "Sikkim": {
    districts: ["Gangtok", "Gyalshing", "Mangan", "Namchi", "Pakyong", "Soreng"],
    cities: [
      "Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo",
      "Singtam", "Jorethang", "Nayabazar"
    ]
  },

  "Tamil Nadu": {
    districts: [
      "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
      "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur",
      "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Nilgiris", "Namakkal",
      "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
      "Tenkasi", "Tiruppur", "Tiruchirappalli", "Theni", "Tirunelveli", "Thanjavur",
      "Thoothukudi", "Tirupattur", "Tiruvallur", "Tiruvarur", "Tiruvannamalai",
      "Vellore", "Viluppuram", "Virudhunagar"
    ],
    cities: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
      "Tirunelveli", "Erode", "Vellore", "Tiruppur", "Thoothukudi",
      "Thanjavur", "Dindigul", "Cuddalore", "Kanchipuram", "Krishnagiri",
      "Namakkal", "Nagercoil", "Ooty"
    ]
  },

  "Telangana": {
    districts: [
      "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial",
      "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy",
      "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahbubnagar",
      "Mancherial", "Medak", "Medchal–Malkajgiri", "Mulugu", "Nalgonda", "Nagarkurnool",
      "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla",
      "Ranga Reddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
      "Warangal", "Yadadri Bhuvanagiri"
    ],
    cities: [
      "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam",
      "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet",
      "Siddipet", "Miryalaguda", "Jagtial", "Mancherial"
    ]
  },

  "Tripura": {
    districts: [
      "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura",
      "Unakoti", "West Tripura"
    ],
    cities: [
      "Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia",
      "Ambassa", "Khowai", "Sonamura"
    ]
  },

  "Uttar Pradesh": {
    districts: [
      "Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya",
      "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki",
      "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli",
      "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad",
      "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur",
      "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj",
      "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri",
      "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau",
      "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh",
      "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar",
      "Shahjahanpur", "Shamli", "Shrawasti", "Siddharthnagar", "Sitapur", "Sonbhadra",
      "Sultanpur", "Unnao", "Varanasi"
    ],
    cities: [
      "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi",
      "Meerut", "Prayagraj", "Noida", "Bareilly", "Aligarh",
      "Moradabad", "Saharanpur", "Gorakhpur", "Firozabad", "Jhansi",
      "Mathura", "Muzaffarnagar", "Shahjahanpur", "Rampur", "Ayodhya"
    ]
  },

  "Uttarakhand": {
    districts: [
      "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital",
      "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar",
      "Uttarkashi"
    ],
    cities: [
      "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh",
      "Nainital", "Rudrapur", "Kashipur", "Kotdwar", "Pithoragarh"
    ]
  },

  "West Bengal": {
    districts: [
      "Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur",
      "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong",
      "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman",
      "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia",
      "South 24 Parganas", "Uttar Dinajpur"
    ],
    cities: [
      "Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman",
      "Malda", "Howrah", "Kharagpur", "Haldia", "Darjeeling",
      "Jalpaiguri", "Bankura", "Krishnanagar", "Raiganj", "Cooch Behar"
    ]
  },

  // Union Territories
  "Andaman and Nicobar Islands": {
    districts: ["Nicobar", "North and Middle Andaman", "South Andaman"],
    cities: ["Port Blair", "Diglipur", "Rangat", "Car Nicobar"]
  },

  "Chandigarh": {
    districts: ["Chandigarh"],
    cities: ["Chandigarh", "Mani Majra", "Panchkula", "Mohali"]
  },

  "Dadra and Nagar Haveli and Daman and Diu": {
    districts: ["Dadra and Nagar Haveli", "Daman", "Diu"],
    cities: ["Silvassa", "Daman", "Diu", "Amli", "Naroli"]
  },

  "Delhi": {
    districts: [
      "Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi",
      "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi",
      "West Delhi"
    ],
    cities: [
      "New Delhi", "Dwarka", "Rohini", "Saket", "Janakpuri",
      "Pitampura", "Lajpat Nagar", "Connaught Place", "Karol Bagh", "Preet Vihar",
      "Noida Extension", "Najafgarh", "Shahdara"
    ]
  },

  "Jammu and Kashmir": {
    districts: [
      "Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu",
      "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri",
      "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
    ],
    cities: [
      "Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore",
      "Udhampur", "Kathua", "Poonch", "Rajouri", "Kupwara"
    ]
  },

  "Ladakh": {
    districts: ["Kargil", "Leh", "Zanskar", "Sham", "Nubra", "Changthang", "Drass"],
    cities: ["Leh", "Kargil", "Diskit", "Padum", "Drass"]
  },

  "Lakshadweep": {
    districts: ["Lakshadweep"],
    cities: ["Kavaratti", "Agatti", "Amini", "Andrott"]
  },

  "Puducherry": {
    districts: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
    cities: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Oulgaret"]
  },
};

export default states;