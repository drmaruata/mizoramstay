insert into public.amenities(name, category) values
('Wi-Fi','Connectivity'),('Breakfast','Food'),('Parking','Property'),('Hot water','Bathroom'),('Garden','Outdoor'),('Mountain view','View'),('Generator','Power'),('Family room','Room')
on conflict(name) do nothing;

insert into public.destinations(name, slug, district, short_description, description, latitude, longitude) values
('Aizawl','aizawl','Aizawl','Mizoram’s urban gateway, food, views and local culture.','Gateway destination for city stays, local food and access to surrounding attractions.',23.7271,92.7176),
('Reiek','reiek','Aizawl','Mountain scenery, village atmosphere and a classic day trip.','A mountain destination suited to short nature and culture-focused stays.',23.6833,92.6167),
('Champhai','champhai','Champhai','Rolling landscapes, culture and border-region travel.','A destination for landscapes, culture and longer regional trips.',23.4561,93.3287),
('Thenzawl','thenzawl','Serchhip','Nature-focused travel around waterfalls and forested hills.','A nature-oriented destination with attractions around forested hills.',23.3000,92.9500)
on conflict(slug) do nothing;
