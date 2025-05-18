import React, { useState, useEffect } from 'react';
import '../styles/custprofile.css';
// import ProfileAddressForm from './ProfileAddressForm';

const demoProfileImage = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT token:', e);
    return null;
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: '',
    image: '',
  });
  const [loading, setLoading] = useState(true);
  // Removed isEditing state, replaced with popup control
  const [showEditProfilePopup, setShowEditProfilePopup] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  // Removed showAllAddresses state
  const [currentAddressIndex, setCurrentAddressIndex] = useState(0);
  // const [tokenPayload, setTokenPayload] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // New state for addresses and editing address
  const [addresses, setAddresses] = useState([]);
  const [currentAddress, setCurrentAddress] = useState({
    fullname: '',
    phone: '',
    email: '',
    pincode: '',
    state: '',
    city: '',
    house: '',
    road: '',
  });
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState(null);

  // Function to handle opening the add address form
  const openAddAddressForm = () => {
    setCurrentAddress({
      fullname: '',
      phone: '',
      pincode: '',
      state: '',
      city: '',
      house: '',
      road: '',
    });
    setIsEditingAddress(false);
    setEditingAddressIndex(null);
    setShowAddressForm(true);
  };

  // Function to handle opening the edit address form as a popup
  const openEditAddressForm = (index) => {
    setCurrentAddress(addresses[index]);
    setIsEditingAddress(true);
    setEditingAddressIndex(index);
    setShowAddressForm(true);
  };

  // Handle input changes in address form
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setCurrentAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Use current location to fill address fields
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use a geocoding API to get address details from lat/lng
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (!response.ok) {
            alert('Failed to get location details');
            return;
          }
          const data = await response.json();
          const address = data.address || {};
          setCurrentAddress((prev) => ({
            ...prev,
            fullname: prev.fullname,
            phone: prev.phone,
            pincode: address.postcode || '',
            state: address.state || '',
            city: address.city || address.town || address.village || '',
            house: address.house_number || '',
            road: address.road || '',
          }));
        } catch (error) {
          alert('Error fetching location details');
        }
      },
      () => {
        alert('Unable to retrieve your location');
      }
    );
  };

  // Save address (add or update)
  const saveAddress = async () => {
    if (
      !currentAddress.fullname ||
      !currentAddress.phone ||
      !currentAddress.pincode ||
      !currentAddress.state ||
      !currentAddress.city
    ) {
      alert('Please fill in all required fields');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to save address.');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/user/address', {
        method: isEditingAddress ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: currentAddress.id || null,
          fullname: currentAddress.fullname,
          phone: currentAddress.phone,
          email: currentAddress.email,
          pincode: currentAddress.pincode,
          state: currentAddress.state,
          city: currentAddress.city,
          house: currentAddress.house,
          road: currentAddress.road,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to save address.');
        return;
      }
      const data = await response.json();
      if (isEditingAddress && editingAddressIndex !== null) {
        // Update existing address in state
        setAddresses((prev) =>
          prev.map((addr, idx) =>
            idx === editingAddressIndex ? { ...currentAddress, id: currentAddress.id } : addr
          )
        );
      } else {
        // Add new address with id from backend
        setAddresses((prev) => [...prev, { ...currentAddress, id: data.id }]);
      }
      setShowAddressForm(false);
    } catch (error) {
      console.error('Error saving address:', error);
      alert('Error saving address.');
    }
  };

  useEffect(() => {
    const fetchUserProfileAndAddresses = async () => {
      const token = localStorage.getItem('token');
      console.log('Token in profilePage useEffect:', token);
      if (!token) {
        setErrorMessage('No token found. Please log in.');
        setLoading(false);
        return;
      }
  
      // Load from localStorage first
      const storedProfile = localStorage.getItem('profile');
      const storedAddresses = localStorage.getItem('addresses');
      if (storedProfile && storedAddresses) {
        try {
          console.log('Loading profile and addresses from localStorage');
          setProfile(JSON.parse(storedProfile));
          setAddresses(JSON.parse(storedAddresses));
          setEditName(JSON.parse(storedProfile).name || '');
          setEditEmail(JSON.parse(storedProfile).email || '');
          setLoading(false);
        } catch (e) {
          console.error('Error parsing localStorage profile or addresses:', e);
          localStorage.removeItem('profile');
          localStorage.removeItem('addresses');
        }
      }
  
      try {
        console.log('Fetching profile and addresses from API');
        const [profileResponse, addressResponse] = await Promise.all([
          fetch('http://localhost:5000/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('http://localhost:5000/api/user/address', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);
        if (!profileResponse.ok || !addressResponse.ok) {
          console.error('Failed to fetch profile or addresses:', profileResponse.status, addressResponse.status);
          setErrorMessage('Failed to fetch profile or addresses.');
          setLoading(false);
          return;
        }
        const profileData = await profileResponse.json();
        const addressesData = await addressResponse.json();
        console.log('Profile data fetched:', profileData);
        console.log('Addresses data fetched:', addressesData);
        setProfile(profileData);
        setEditName(profileData.name || '');
        setEditEmail(profileData.email || '');
        setAddresses(addressesData || []);
        setLoading(false);
  
        localStorage.setItem('profile', JSON.stringify(profileData));
        localStorage.setItem('addresses', JSON.stringify(addressesData || []));
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setErrorMessage('Error fetching user profile.');
        setLoading(false);
      }
    };
    fetchUserProfileAndAddresses();
  }, []);
  

  
  // In handleSave, after successful profile update:
  localStorage.setItem('profile', JSON.stringify({
    name: editName,
    email: editEmail,
    role: profile.role,
    image: profile.image,
  }));
  

  // useEffect(() => {
  //   const fetchUserProfileAndAddresses = async () => {
  //     const token = localStorage.getItem('token');
  //     console.log('Token in profilePage:', token);
  //     if (!token) {
  //       setErrorMessage('No token found. Please log in.');
  //       setLoading(false);
  //       return;
  //     }
  //     // const decoded = decodeJwtPayload(token);
  //     // setTokenPayload(decoded);
  //     // console.log('Decoded token payload:', decoded);
  //     try {
  //       const [profileResponse, addressResponse] = await Promise.all([
  //         fetch('http://localhost:5000/api/user/profile', {
  //           headers: {
  //             'Authorization': `Bearer ${token}`,
  //           },
  //         }),
  //         fetch('http://localhost:5000/api/user/address', {
  //           headers: {
  //             'Authorization': `Bearer ${token}`,
  //           },
  //         }),
  //       ]);
  //       if (!profileResponse.ok) {
  //         const errorText = await profileResponse.text();
  //         console.error('Profile fetch failed:', errorText);
  //         setErrorMessage(`Failed to fetch profile: ${errorText}`);
  //         setLoading(false);
  //         return;
  //       }
  //       if (!addressResponse.ok) {
  //         const errorText = await addressResponse.text();
  //         console.error('Address fetch failed:', errorText);
  //         setErrorMessage(`Failed to fetch addresses: ${errorText}`);
  //         setLoading(false);
  //         return;
  //       }
  //       const profileData = await profileResponse.json();
  //       const addressesData = await addressResponse.json();
  //       setProfile({
  //         name: profileData.name || 'Unknown User',
  //         email: profileData.email || '',
  //         role: profileData.role || '',
  //         image: profileData.image || '',
  //       });
  //       setEditName(profileData.name || '');
  //       setEditEmail(profileData.email || '');
  //       setAddresses(addressesData || []);
  //       setLoading(false);
  //     } catch (error) {
  //       console.error('Error fetching user profile:', error);
  //       setErrorMessage('Error fetching user profile.');
  //       setLoading(false);
  //     }
  //   };
  //   fetchUserProfileAndAddresses();
  // }, []);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfile((prev) => ({ ...prev, image: ev.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login to update profile.');
      return;
    }

    try {
      // Update name and email via JSON PUT request
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          role: profile.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update profile.');
        return;
      }

      // If image changed, upload separately
      if (editImage) {
        const formData = new FormData();
        formData.append('image', editImage);

        const imageResponse = await fetch('http://localhost:5000/api/user/profile/image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (!imageResponse.ok) {
          alert('Failed to upload profile image.');
          return;
        }

        const imageData = await imageResponse.json();
        setProfile((prev) => ({
          ...prev,
          image: imageData.imageUrl || prev.image,
        }));
      }

      setProfile((prev) => ({
        ...prev,
        name: editName,
        email: editEmail,
      }));
      setShowEditProfilePopup(false);
      setEditImage(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile.');
    }
  };

  if (loading) {
    return (
      <div className="custprofile-container">
        <h1 className="custprofile-title">Profile</h1>
        <p>Loading profile information...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="custprofile-container">
        <h1 className="custprofile-title">Profile</h1>
        <p style={{ color: 'red' }}>{errorMessage}</p>
      </div>
    );
  }

  if (!profile.name) {
    return (
      <div className="custprofile-container">
        <h1 className="custprofile-title">Profile</h1>
        <p>Please log in to view your profile information.</p>
      </div>
    );
  }

  return (
    <div className="custprofile-container">
      <h1 className="custprofile-title">Profile</h1>
      <div className="custprofile-card" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1}}>
          <img
            src={profile.image || demoProfileImage}
            alt="Profile"
            className="profile-image"
          />
          <>
            <div className='prof-info'>
              <p><strong>Name:</strong> {profile.name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
            </div>

            <button
              className="custprofile-profbutton"
              onClick={() => {
                setEditName(profile.name);
                setEditEmail(profile.email);
                setEditImage(null);
                setShowEditProfilePopup(true);
              }}
            >
              Edit Profile
            </button>

            <button className="custprofile-addresbutton" onClick={openAddAddressForm}>Add Address</button>

            {showEditProfilePopup && (
              <div className="edit-profile-popup-overlay" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
              }}>
                <div className="edit-profile-popup" style={{
                  backgroundColor: 'var(--two2)',
                  padding: '20px',
                  borderRadius: '8px',
                  width: '300px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                }}>
                  <h2>Edit Profile</h2>
                  <label>
                    Name:
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>
                  <label>
                    Email:
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </label>
                  <label>
                    Change Photo:
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                    <button className="custprofile-infobutton" onClick={async () => {
                      await handleSave();
                      setShowEditProfilePopup(false);
                    }}>
                      Save
                    </button>
                    <button className="custprofile-inbutton" onClick={() => setShowEditProfilePopup(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        </div>

        {/* Address display and form popup */}
        <div style={{ flex: 1, marginLeft: '20px' }}>
          {addresses.length > 0 && (
            <div className="address-box" style={{ border: '1px solid var(--white)', padding: '10px' }}>
              <h3>Saved Address</h3>
              {addresses.length > 1 && (
                <button
                  className="custprofile-viewmorebutton"
                  onClick={() =>
                    setCurrentAddressIndex((prevIndex) => (prevIndex + 1) % addresses.length)
                  }
                >
                  Next Address
                </button>
              )}
              {addresses.length > 0 && (
                <div style={{ marginBottom: '10px', paddingBottom: '5px' }}>
                  <p><strong>Full Name:</strong> {addresses[currentAddressIndex].fullname}</p>
                  <p><strong>Phone:</strong> {addresses[currentAddressIndex].phone}</p>
                  <p><strong>Email:</strong> {addresses[currentAddressIndex].email}</p>
                  <p><strong>Pincode:</strong> {addresses[currentAddressIndex].pincode}</p>
                  <p><strong>State:</strong> {addresses[currentAddressIndex].state}</p>
                  <p><strong>City:</strong> {addresses[currentAddressIndex].city}</p>
                  <p><strong>House No/Building:</strong> {addresses[currentAddressIndex].house}</p>
                  <p><strong>Road/Area:</strong> {addresses[currentAddressIndex].road}</p>
                  <button className="custprofile-editbutton" onClick={() => openEditAddressForm(currentAddressIndex)} >
                    <img src="https://cdn-icons-png.flaticon.com/512/1159/1159633.png" alt="Edit"/>
                  </button>
                </div>
              )}
            </div>
          )}

          {showAddressForm && (
            <div className="address-form-popup" >
              <h3>{isEditingAddress ? 'Edit Address' : 'Add Address'}</h3>
              <label>
                Full Name:
                <input
                  type="text"
                  name="fullname"
                  value={currentAddress.fullname}
                  onChange={handleAddressChange}
                  placeholder="Enter full name"
                />
              </label>
              <label>
                Phone Number:
                <input
                  type="text"
                  name="phone"
                  value={currentAddress.phone}
                  onChange={handleAddressChange}
                  placeholder="Enter phone number"
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  value={currentAddress.email}
                  onChange={handleAddressChange}
                  placeholder="Enter email"
                />
              </label>
              <label>
                Pincode:
                <input
                  type="text"
                  name="pincode"
                  value={currentAddress.pincode}
                  onChange={handleAddressChange}
                  placeholder="Enter pincode"
                />
              </label>
              <label>
                State:
                <input
                  type="text"
                  name="state"
                  value={currentAddress.state}
                  onChange={handleAddressChange}
                  placeholder="Enter state"
                />
              </label>
              <label>
                City:
                <input
                  type="text"
                  name="city"
                  value={currentAddress.city}
                  onChange={handleAddressChange}
                  placeholder="Enter city"
                />
              </label>
              <label>
                House No / Building Name:
                <input
                  type="text"
                  name="house"
                  value={currentAddress.house}
                  onChange={handleAddressChange}
                  placeholder="Enter house/building"
                />
              </label>
              <label>
                Road Name / Area:
                <input
                  type="text"
                  name="road"
                  value={currentAddress.road}
                  onChange={handleAddressChange}
                  placeholder="Enter road/area"
                />
              </label>
              <button className="custprofile-lbutton" onClick={useCurrentLocation}>Use Current Location</button>
              <button className="custprofile-sabutton" onClick={saveAddress}>Save Address</button>
              <button className="custprofile-cabutton" onClick={() => setShowAddressForm(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      
      </div>
  
  );
}
