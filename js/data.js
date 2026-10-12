window.siteData = {
  hotel: { name: "De Palms Hotels", address: "78 Elelenwo Road, G.R.A. Phase 2, Port Harcourt, Rivers, Nigeria", phone: "+234 915 311 1592", email: "depalmshotelphc@gmail.com", coordinates: "4.8247403,6.9994160", directions: "https://maps.app.goo.gl/mDNiVtFQmwZ2NXzy7", instagram: "https://www.instagram.com/depalmshotelphc?stkn=ynez2nnrxpqb3rp", whatsapp: "https://wa.me/2349153111592?text=Hello%20De%20Palms%2C%20I%27d%20like%20to%20check%20availability." },
  amenities: ["Restaurant", "Swimming Pool", "Spa", "Bar", "Fitness Centre", "Free Wi-Fi", "Room Service", "Free Parking", "Laundry", "24-hour Front Desk"],
  rooms: [
    { name: "Mini Deluxe Room", description: "A cozy, comfortable space for everyday rest. Note: No complimentary breakfast included.", details: "1 single bed", price: 60000, formattedPrice: "₦60,000", breakfast: false, image: "assets/rooms/superdeluxe.webp", features: ["1 Single Bed", "Hot Shower", "Fast Wi-Fi", "Netflix", "No Breakfast"] },
    { name: "Super Deluxe Room", description: "A beautifully furnished room with everyday comfort and complimentary breakfast.", details: "1 single bed", price: 90000, formattedPrice: "₦90,000", breakfast: true, image: "assets/rooms/superdeluxe.webp", video: "assets/rooms/superdeluxe.mp4", features: ["1 Single Bed", "Hot Shower", "Fast Wi-Fi", "Netflix", "Breakfast Included"] },
    { name: "Royal Room", description: "A spacious, well-appointed room for an elevated stay with complimentary breakfast.", details: "1 king-size bed", price: 110000, formattedPrice: "₦110,000", breakfast: true, image: "assets/rooms/royalroom.webp", video: "assets/rooms/royalroom.mp4", features: ["1 King Bed", "Hot Shower", "Fast Wi-Fi", "Netflix", "Breakfast Included"] },
    { name: "Special Room", description: "A polished setting designed for unhurried rest with complimentary breakfast.", details: "1 king-size bed", price: 130000, formattedPrice: "₦130,000", breakfast: true, image: "assets/rooms/specialroom.webp", video: "assets/rooms/specialroom.mp4", features: ["1 King Bed", "Hot Shower", "Fast Wi-Fi", "Netflix", "Breakfast Included"] },
    { name: "Ambassadorial Room", description: "An elegant retreat with refined furnishings, generous space and complimentary breakfast.", details: "1 king-size bed", price: 150000, formattedPrice: "₦150,000", breakfast: true, image: "assets/rooms/ambassadorialroom.webp", video: "assets/rooms/ambassadorialroom.mp4", gallery: ["assets/rooms/ambassadorialliving.webp"], features: ["1 King Bed", "Hot Shower", "Fast Wi-Fi", "Netflix", "Breakfast Included"] },
    { name: "Presidential Room", description: "A generous presidential suite for an expansive luxury stay with complimentary breakfast.", details: "Optional One or Two bedrooms and a sitting room", price: 250000, formattedPrice: "₦250,000", breakfast: true, image: "assets/rooms/presidentialroom.webp", video: "assets/rooms/presidentsuite.mp4", gallery: ["assets/rooms/Presidentialliving.webp"], features: ["1–2 Bedrooms", "Hot Shower & Bath", "Fast Wi-Fi", "Netflix", "Breakfast Included"] }
  ],
  reviews: [
    { author: "Joshua Obiabo Ehoche", rating: 4, timeAgo: "4 years ago", source: "Google", quote: "Very lovely rooms. Clean bathrooms and comfortable amenities. Staff are good too and I enjoyed my dinner tremendously. Had the seafood okra. Nice serene location and beautiful artworks." },
    { author: "Michael A", rating: 4, timeAgo: "2 years ago", source: "Google", quote: "For a Port Harcourt standard, it ranks well in ambience and service. Great and friendly staff members too. Breakfast buffet however finishes early and I had to wait for a refill before I could eat." },
    { author: "Kelechi Wamah", rating: 4, timeAgo: "2 years ago", source: "Google", quote: "De Palm is a well managed hotel. Everything works as it should. Rooms are lovely and very homely. I got the desired rest that was needed." }
  ],
  placesToVisit: [
    { name: "Port Harcourt Pleasure Park", type: "Open-air recreation", detail: "Green space, family time and a change of pace.", image: "assets/places/pleasurepack.jpg" },
    { name: "Garden City Amusement Park", type: "Leisure & family fun", detail: "An easy outing for an unhurried afternoon.", image: "assets/places/gardencitypark.jpg" },
    { name: "Genesis Cinemas", type: "Cinema & entertainment", detail: "For a film, a date night or a relaxed evening out.", image: "assets/places/genesiscenima.jpg" }
  ],
  spaces: [
    { name: "Pool Area", tagline: "Relax. Refresh.", description: "A private courtyard pool surrounded by palm trees and vibrant murals — the perfect place to unwind.", image: "assets/lifestylecomfort/swimmingpool.webp", liveImage: "assets/lifestylecomfort/livelypool.jpg" },
    { name: "Bush Bar", tagline: "Drinks under the canopy.", description: "An intimate open-air bar wrapped in greenery and warm string lights, perfect for evening cocktails.", image: "assets/lifestylecomfort/bushbar.jpg" },
    { name: "Dining", tagline: "Savour every moment.", description: "A refined restaurant space where breakfast, lunch and dinner are served with care and attention.", image: "assets/lifestylecomfort/restaurant.webp", liveImage: "assets/lifestylecomfort/livelyrestaurant.jpg" },
    { name: "Rooftop Lounge", tagline: "Sunsets and good company.", description: "An elevated terrace with panoramic views of Port Harcourt, ideal for a calm evening or gathering.", image: "assets/lifestylecomfort/rooftop.webp", liveImage: "assets/lifestylecomfort/livelyrooftop.jpg" },
    { name: "Lobby", tagline: "Where your stay begins.", description: "A warm and welcoming lobby with tasteful interiors and a sense of arrival that sets the tone.", image: "assets/lifestylecomfort/lobby.webp" },
    { name: "Corridor", tagline: "Quiet elegance throughout.", description: "Thoughtfully designed hallways that carry the same attention to detail from lobby to room.", image: "assets/lifestylecomfort/hallway.webp" }
  ],
  dining: {
    title: "Local & Continental 5-Star Dining",
    description: "Every meal at De Palms is crafted with passion. Our state-of-the-art kitchen brings together seasoned culinary chefs delivering 5-star local Nigerian delicacies and refined continental dishes.",
    buffet: {
      title: "Saturday Grand Buffet",
      schedule: "Every Saturday",
      singlePrice: "₦25,000",
      couplePrice: "₦45,000",
      description: "An all-you-can-eat culinary experience showcasing freshly prepared regional specialties, international cuisine, grilled dishes, and decadent desserts."
    }
  },
  spa: {
    title: "Sanctuary for Body & Mind",
    description: "Step into pure tranquility. De Palms Spa offers curated therapeutic treatments designed to relieve tension, revitalize your skin, and restore inner harmony.",
    phone: "07039482716",
    whatsapp: "https://wa.me/2347039482716?text=Hello%20De%20Palms%20Spa%2C%20I%20would%20like%20to%20inquire%20about%20booking%20a%20spa%20treatment.",
    treatments: [
      { name: "Jelly Pedicure", description: "Luxurious, deeply hydrating gel foot soak that exfoliates, softens dry skin, and melts away fatigue." },
      { name: "Dermaplaning Facials", description: "Gentle physical exfoliation removing dead skin cells and peach fuzz for an instantly smooth, luminous glow." },
      { name: "Deep Cleanse Facials", description: "Thorough pore clarification, targeted extraction, and revitalizing botanicals to restore balance." },
      { name: "Regular Pedicure", description: "Classic foot and nail grooming with gentle scrub, cuticle care, light massage, and buffing." },
      { name: "Swedish Massage", description: "Flowing, therapeutic strokes to boost circulation, ease muscle tension, and soothe the entire body." },
      { name: "Deep Tissue Massage", description: "Focused, firm therapeutic pressure to dissolve deep muscular knots, tension, and chronic stiffness." }
    ]
  }
};
