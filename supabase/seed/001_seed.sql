-- Seed sample data for development/testing
insert into profiles (id, full_name, role, avatar_url)
values
  ('11111111-1111-1111-1111-111111111111', 'Admin User', 'admin', null)
on conflict do nothing;

insert into properties (id, title, description, type, address, city, area, price, rent_frequency, bedrooms, bathrooms, size, amenities, status, bayut_url, external_url, created_by)
values
  ('22222222-2222-2222-2222-222222222222', 'Modern 2BR Apartment', 'A bright modern 2 bedroom apartment.', 'apartment', '123 Palm St', 'Dubai', 'Jumeirah', 1200000, null, 2, 2, 980, array['Pool','Gym','Parking'], 'published', 'https://www.bayut.com/example-1', null, '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'Spacious 4BR Villa', 'Family villa with garden and pool.', 'villa', '45 Palm Oasis', 'Dubai', 'Palm Jumeirah', 4500000, null, 4, 5, 4200, array['Pool','Garden','Garage'], 'published', 'https://www.bayut.com/example-2', null, '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

insert into property_images (property_id, url, sort_order, is_cover)
values
  ('22222222-2222-2222-2222-222222222222', 'https://picsum.photos/seed/apt1/1200/800', 0, true),
  ('22222222-2222-2222-2222-222222222222', 'https://picsum.photos/seed/apt2/1200/800', 1, false),
  ('33333333-3333-3333-3333-333333333333', 'https://picsum.photos/seed/villa1/1200/800', 0, true)
on conflict do nothing;
