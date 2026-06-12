import React, { useState } from 'react';

const VendorProfile: React.FC = () => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    business: 'Catering Delight',
    category: 'Catering',
    description: 'Premium catering services for all occasions with customizable menus and exceptional service.',
    contact_email: 'contact@cateringdelight.com',
    contact_phone: '+1 (555) 123-4567',
    location: 'New York, NY'
  });
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  const [unavailableUntil, setUnavailableUntil] = useState('');
  const [unavailableMessage, setUnavailableMessage] = useState('This vendor is currently unavailable.');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Mock vendor data
  const vendor = {
    business_name: 'Catering Delight',
    category: 'Catering',
    description: 'Premium catering services for all occasions with customizable menus and exceptional service.',
    contact_email: 'contact@cateringdelight.com',
    contact_phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    logo_url: '',
    accepting_bookings: true,
    id: 'mock-id',
    user_id: 'mock-user-id'
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBookingToggle = (checked: boolean) => {
    setAcceptingBookings(checked);

    // If turning off bookings and no return date is set, use a default message
    if (!checked && !unavailableMessage) {
      setUnavailableMessage('This vendor is currently unavailable.');
    }

    // Mock success toast
    console.log('Booking availability updated to:', checked);

    // Mock revert on error - uncomment to simulate error
    // setAcceptingBookings(!checked);
  };

  const handleUnavailableUpdate = () => {
    console.log('Unavailability updated:', { unavailableUntil, unavailableMessage });
    // Mock success
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Logo upload attempted:', file.name);
    setUploadingLogo(true);

    // Simulate upload delay
    setTimeout(() => {
      setUploadingLogo(false);
      // Mock success
      console.log('Logo uploaded successfully');

      // Mock error - uncomment to simulate error
      // console.error('Upload failed');
    }, 1500);
  };

  const handleEdit = () => {
    setForm({
      business: vendor.business_name,
      category: vendor.category,
      description: vendor.description || '',
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      location: vendor.location || ''
    });
    setEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Profile updated:', form);
      setSubmitting(false);
      setEditing(false);

      // Update mock vendor with new data
      vendor.business_name = form.business;
      vendor.category = form.category;
      vendor.description = form.description;
      vendor.contact_email = form.contact_email;
      vendor.contact_phone = form.contact_phone;
      vendor.location = form.location;
    }, 1000);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-black">Edit Profile</h2>
        <form className="space-y-4" onSubmit={handleSave}>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
            type="text"
            name="business"
            placeholder="Business Name"
            value={form.business}
            onChange={handleChange}
            required
          />
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
            name="category"
            value={form.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            <option value="Catering">Catering</option>
            <option value="Photography">Photography</option>
            <option value="DJ/Music">DJ/Music</option>
            <option value="Decor">Decor</option>
            <option value="Other">Other</option>
          </select>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 h-24"
            name="description"
            placeholder="Business Description"
            value={form.description}
            onChange={handleChange}
          />
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
            type="email"
            name="contact_email"
            placeholder="Contact Email"
            value={form.contact_email}
            onChange={handleChange}
          />
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
            type="tel"
            name="contact_phone"
            placeholder="Contact Phone"
            value={form.contact_phone}
            onChange={handleChange}
          />
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
            type="text"
            name="location"
            placeholder="Location"
            value={form.location}
            onChange={handleChange}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-lime-500 text-black hover:bg-black hover:text-lime-500 font-bold px-4 py-2 rounded disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            {vendor.logo_url ? (
              <img
                src={vendor.logo_url}
                alt={`${vendor.business_name} logo`}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                {/* Camera icon - using text */}
                <span className="text-gray-400">📷</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
              id="logo-upload"
            />
            <button
              type="button"
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0 border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? '...' : '📤'}
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-black">{vendor.business_name}</h2>
            <p className="text-gray-600">{vendor.category}</p>
            {vendor.description && (
              <p className="text-gray-500 text-sm mt-1">{vendor.description}</p>
            )}
            {vendor.location && (
              <p className="text-gray-500 text-sm">📍 {vendor.location}</p>
            )}
          </div>
        </div>
        <button
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          onClick={handleEdit}
        >
          Edit Profile
        </button>
      </div>

      {/* Booking Availability Section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-semibold text-black mb-4">Booking Availability</h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Custom Switch Component */}
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${acceptingBookings ? 'bg-lime-500' : 'bg-gray-300'
                }`}
              onClick={() => handleBookingToggle(!acceptingBookings)}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${acceptingBookings ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <label className="font-medium text-black">
              Accepting Bookings
            </label>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${acceptingBookings
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
            }`}>
            {acceptingBookings ? 'Available' : 'Unavailable'}
          </div>
        </div>

        {!acceptingBookings && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Date (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  📅
                </span>
                <input
                  type="date"
                  value={unavailableUntil}
                  onChange={(e) => setUnavailableUntil(e.target.value)}
                  className="w-full pl-10 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for open-ended unavailability
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unavailability Message
              </label>
              <textarea
                value={unavailableMessage}
                onChange={(e) => setUnavailableMessage(e.target.value)}
                placeholder="This vendor is currently unavailable."
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lime-500 h-20 resize-none"
              />
            </div>

            <button
              onClick={handleUnavailableUpdate}
              className="bg-lime-500 text-black hover:bg-black hover:text-lime-500 px-4 py-2 rounded text-sm"
            >
              Update Unavailability Settings
            </button>

            {/* Preview of what customers will see */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Preview:</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-sm">
                  {unavailableMessage || 'This vendor is currently unavailable.'}
                  {unavailableUntil && (
                    <span className="block mt-1 font-medium">
                      Expected return: {new Date(unavailableUntil).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProfile;