const processLocation = (req, res, next) => {
  console.log('=== PROCESS LOCATION MIDDLEWARE ===');
  console.log('Todos los campos en req.body:', Object.keys(req.body));
  
  const { locationCity, locationAddress, locationLongitude, locationLatitude } = req.body;

  console.log('locationCity:', locationCity);
  console.log('locationAddress:', locationAddress);
  console.log('locationLongitude:', locationLongitude);
  console.log('locationLatitude:', locationLatitude);

  if (locationCity && locationAddress && locationLongitude && locationLatitude) {
    
    req.body.location = {
      city: locationCity,
      address: locationAddress,
      coordinates: [
        parseFloat(locationLongitude),
        parseFloat(locationLatitude)
      ]
    };
    
    console.log('✅ Objeto location creado:', req.body.location);
    
    delete req.body.locationCity;
    delete req.body.locationAddress;
    delete req.body.locationLongitude;
    delete req.body.locationLatitude;
  } else {
    console.log('❌ Faltan campos de ubicación');
  }
  
  next();
};

module.exports = processLocation;