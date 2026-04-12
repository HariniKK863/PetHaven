ALTER TABLE public.adoption_requests
  ADD COLUMN IF NOT EXISTS pet_name text,
  ADD COLUMN IF NOT EXISTS pet_species text,
  ADD COLUMN IF NOT EXISTS pet_breed text,
  ADD COLUMN IF NOT EXISTS pet_age text,
  ADD COLUMN IF NOT EXISTS pet_image_url text,
  ADD COLUMN IF NOT EXISTS pet_location text,
  ADD COLUMN IF NOT EXISTS pet_shelter_name text;

UPDATE public.adoption_requests
SET
  pet_name = COALESCE(adoption_requests.pet_name, pets.name),
  pet_species = COALESCE(adoption_requests.pet_species, pets.species),
  pet_breed = COALESCE(adoption_requests.pet_breed, pets.breed),
  pet_age = COALESCE(adoption_requests.pet_age, pets.age),
  pet_image_url = COALESCE(adoption_requests.pet_image_url, pets.image_url),
  pet_location = COALESCE(adoption_requests.pet_location, pets.location),
  pet_shelter_name = COALESCE(adoption_requests.pet_shelter_name, pets.shelter_name)
FROM public.pets
WHERE pets.id = adoption_requests.pet_id;
