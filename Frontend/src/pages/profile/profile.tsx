import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  XCircle,
  CheckCircle,
  Star,
  Loader2,
  Camera,
  Github,
  Linkedin,
  Globe,
  X,
  MapPin,
  Link as LinkIcon,
  User as UserIcon,
  Save,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
import { useUser, User } from '../../context/UserContext';
import { toast } from 'sonner';
import LoadingSpinner from '../../components/ui/loading-spinner';

/* ----------------------------- Schema ----------------------------- */

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  bio: z
    .string()
    .max(160, 'Bio cannot exceed 160 characters')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Location cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid URL')
    .or(z.literal(''))
    .optional()
    .transform(val => val || undefined),
  github: z
    .string()
    .url('Please enter a valid GitHub URL')
    .or(z.literal(''))
    .optional()
    .transform(val => val || undefined)
    .refine(val => !val || val.includes('github.com'), {
      message: 'Must be a valid GitHub URL',
    }),
  linkedin: z
    .string()
    .url('Please enter a valid LinkedIn URL')
    .or(z.literal(''))
    .optional()
    .transform(val => val || undefined)
    .refine(val => !val || val.includes('linkedin.com'), {
      message: 'Must be a valid LinkedIn URL',
    }),
});

type ProfileFormData = {
  name: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
};

interface ExtendedUser extends Omit<User, 'email'> {
  _id?: string;
  name: string;
  email?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  profilePicture?: string;
  points?: number;
  skills?: string[];
  fullName?: string;
  avatar?: string;
  [key: string]: any; // For any additional properties
}

/* ----------------------------- Helpers ----------------------------- */

function handleError(error: any): Error {
  if (error?.response?.data?.message) {
    return new Error(error.response.data.message);
  }
  if (error?.message) {
    return new Error(error.message);
  }
  return new Error('An unexpected error occurred');
}

/* ----------------------------- Component ----------------------------- */

const ProfilePage: React.FC = () => {
  const { user: contextUser, setUser: setContextUser, updateUser } = useUser();
  const [user, setUser] = useState<ExtendedUser>(contextUser || {
    _id: '',
    name: '',
    email: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    linkedin: '',
    profilePicture: '',
    points: 0,
    skills: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const [uploadingImage, setUploadingImage] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const [previewImage, setPreviewImage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      bio: '',
      location: '',
      website: '',
      github: '',
      linkedin: '',
    },
  });

  // Watch form values for character counting
  const bioValue = watch('bio', '');

  /* ----------------------------- Data ----------------------------- */

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First try to get from localStorage for immediate UI update
      const savedUser = localStorage.getItem('user_data');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          reset({
            name: parsedUser.fullName || parsedUser.name || '',
            bio: parsedUser.bio || '',
            location: parsedUser.location || '',
            website: parsedUser.website || '',
            github: parsedUser.github || '',
            linkedin: parsedUser.linkedin || '',
          });
        } catch (e) {
          // Error parsing saved user data
        }
      }
      
      // Then fetch fresh data from the server
      const response = await apiService.getProfile();
      
      // Handle the response
      const responseData = response;
      
      if (!responseData) {
        throw new Error('No data received from server');
      }
      
      // Map the API response to our user object
      const userData = {
        _id: responseData._id || responseData.id,
        name: responseData.fullName || responseData.name || '',
        email: responseData.email,
        username: responseData.username,
        bio: responseData.bio || '',
        location: responseData.location || '',
        website: responseData.website || '',
        github: responseData.github || '',
        linkedin: responseData.linkedin || '',
        profilePicture: responseData.profilePicture || responseData.avatar || '',
        points: responseData.points || 0,
        skills: responseData.skills || []
      };
      
      if (!userData._id) {
        throw new Error('Invalid user data: missing ID');
      }
      
      // Update user state
      setUser(userData);
      
      // Update form with fresh data
      reset({
        name: userData.name,
        bio: userData.bio,
        location: userData.location,
        website: userData.website,
        github: userData.github,
        linkedin: userData.linkedin,
      });
      
      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(userData));
      
    } catch (err) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ----------------------------- Image ----------------------------- */

const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setUploadingImage(true);
    setError(null);
    setSuccess(null);

    // Send the file directly to backend
    const updatedUser = await apiService.updateProfilePicture(file);

    // Update context using updateUser to keep both fields in sync
    updateUser({
      avatar: updatedUser.avatar,
      profilePicture: updatedUser.avatar
    });

    // Update local state
    const newUserState = {
      ...user,
      avatar: updatedUser.avatar,
      profilePicture: updatedUser.avatar,
      ...updatedUser
    };

    setUser(newUserState);
    setPreviewImage(updatedUser.avatar || null);

    setSuccess('Profile picture updated successfully!');
    setTimeout(() => setSuccess(null), 5000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update profile picture';
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);

    if (fileInputRef.current) fileInputRef.current.value = '';
  } finally {
    setUploadingImage(false);
  }
};

const handleRemoveImage = async () => {
  try {
    setUploadingImage(true);
    setError(null);
    setSuccess(null);
    
    // 1. Update context using updateUser to keep both fields in sync
    updateUser({
      avatar: '',
      profilePicture: ''
    });
    
    // 2. Update local state
    const newUserState = {
      ...user,
      profilePicture: '',
      avatar: ''
    };
    
    setUser(newUserState);
    setPreviewImage(null);
    
    // 3. Clear file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // 4. Update profile on server with empty avatar
    await apiService.updateProfile({ avatar: '', profilePicture: '' });
    
    setSuccess('Profile picture removed successfully!');
    setTimeout(() => setSuccess(null), 5000);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to remove profile picture';
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  } finally {
    setUploadingImage(false);
  }
};
 

  /* ----------------------------- Submit ----------------------------- */

const onSubmit: SubmitHandler<ProfileFormData> = async (formData) => {
  setIsSubmitting(true);
  setError(null);
  setSuccess(null);
  
  try {
    // 1. Handle image upload if a new file is selected
    let imageUrl = user?.avatar || user?.profilePicture;
    if (fileInputRef.current?.files?.[0]) {
      try {
        imageUrl = await apiService.uploadImage(fileInputRef.current.files[0]);
      } catch (uploadError) {
        throw new Error('Failed to upload profile picture. ' + (uploadError instanceof Error ? uploadError.message : 'Please try again.'));
      }
    }

    // 2. Prepare the data to send
    const updateData: Record<string, any> = {
      fullName: formData.name?.trim(),
      name: formData.name?.trim(),
    };

    // Only add fields that have values
    const optionalFields = ['bio', 'location', 'website', 'github', 'linkedin'] as const;
    optionalFields.forEach(field => {
      const value = formData[field]?.trim();
      if (value) {
        updateData[field] = value;
      }
    });

    // 3. Add the image URL if we have one
    if (imageUrl) {
      updateData.avatar = imageUrl;
      updateData.profilePicture = imageUrl;
    }

    // 4. Send the update request
    const response = await apiService.updateProfile(updateData);
    
    // 5. Update local state with the response
    const updatedUserData = {
      ...user,
      ...response,
      name: response.fullName || response.name || user?.name || '',
      fullName: response.fullName || response.name || user?.name || '',
      profilePicture: response.avatar || response.profilePicture || user?.profilePicture,
      avatar: response.avatar || response.profilePicture || user?.profilePicture,
      bio: response.bio !== undefined ? response.bio : (user?.bio || ''),
      location: response.location !== undefined ? response.location : (user?.location || ''),
      website: response.website !== undefined ? response.website : (user?.website || ''),
      github: response.github !== undefined ? response.github : (user?.github || ''),
      linkedin: response.linkedin !== undefined ? response.linkedin : (user?.linkedin || '')
    };
    
    // 6. Update all relevant states
    setUser(updatedUserData);
    setContextUser(updatedUserData);
    localStorage.setItem('user_data', JSON.stringify(updatedUserData));
    
    // 7. Update form state to match the new data
    reset({
      name: response.fullName || response.name || formData.name || '',
      bio: response.bio !== undefined ? response.bio : formData.bio || '',
      location: response.location !== undefined ? response.location : formData.location || '',
      website: response.website !== undefined ? response.website : formData.website || '',
      github: response.github !== undefined ? response.github : formData.github || '',
      linkedin: response.linkedin !== undefined ? response.linkedin : formData.linkedin || ''
    });
    
    // 8. Update preview image if it was changed
    if (imageUrl) {
      setPreviewImage(imageUrl);
    }
    
    // 9. Show success message
    setSuccess('Profile updated successfully!');
    setTimeout(() => setSuccess(null), 5000);
    
  } catch (err) {
    const error = handleError(err);
    setError(error.message || 'Failed to update profile. Please try again.');
    setTimeout(() => setError(null), 5000);
  } finally {
    setIsSubmitting(false);
  }
};

  /* ----------------------------- Loading ----------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  /* ----------------------------- UI ----------------------------- */

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';
  
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white-900">Your Profile</h1>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
          >
            {showEditForm ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                {/* <CheckCircle className="h-5 w-5 text-green-400" aria-hidden="true" /> */}
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {showEditForm ? (
          /* Edit Form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6  shadow overflow-hidden sm:rounded-lg p-6">
            <div className="space-y-6 sm:space-y-5">
              <div>
                {/* <h3 className="text-lg font-medium leading-6 text-white-900">Profile</h3> */}
                <p className="mt-1 text-sm text-white-500">Update your profile information.</p>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="name" className="block text-sm font-medium text-white-700 sm:mt-px sm:pt-2">
                  Full name
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input
                    type="text"
                    id="name"
                    {...register('name')}
                    className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="bio" className="block text-sm font-medium text-white-700 sm:mt-px sm:pt-2">
                  Bio
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <textarea
                    id="bio"
                    rows={3}
                    {...register('bio')}
                    className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
                    defaultValue={''}
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    {bioValue?.length || 0}/160 characters
                  </p>
                  {errors.bio && <p className="mt-2 text-sm text-red-600">{errors.bio.message}</p>}
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="location" className="block text-sm font-medium text-white-700 sm:mt-px sm:pt-2">
                  Location
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input
                    type="text"
                    id="location"
                    {...register('location')}
                    className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
                  />
                  {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location.message}</p>}
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="website" className="block text-sm font-medium text-white-700 sm:mt-px sm:pt-2">
                  Website
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <input
                    type="url"
                    id="website"
                    {...register('website')}
                    className="max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
                  />
                  {errors.website && <p className="mt-2 text-sm text-red-600">{errors.website.message}</p>}
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="github" className="block text-sm font-medium text-white-700 sm:mt-px sm:pt-2">
                  GitHub
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-white-500 text-sm">
                      github.com/
                    </span>
                    <input
                      type="text"
                      id="github"
                      {...register('github')}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                      placeholder="username"
                    />
                  </div>
                  {errors.github && <p className="mt-2 text-sm text-red-600">{errors.github.message}</p>}
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label htmlFor="linkedin" className="block text-sm font-medium text-white-700 sm:mt-px sm:pt-2">
                  LinkedIn
                </label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-white-500 text-sm">
                      linkedin.com/in/
                    </span>
                    <input
                      type="text"
                      id="linkedin"
                      {...register('linkedin')}
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300"
                      placeholder="username"
                    />
                  </div>
                  {errors.linkedin && <p className="mt-2 text-sm text-red-600">{errors.linkedin.message}</p>}
                </div>
              </div>

              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start sm:border-t sm:border-gray-200 sm:pt-5">
                <label className="block text-sm font-medium text-white-700">Photo</label>
                <div className="mt-1 sm:mt-0 sm:col-span-2">
             <div className="flex flex-col items-center">
  <div className="relative h-32 w-32">
    <div className="h-full w-full rounded-full overflow-hidden border-2 border-gray-200">
      {previewImage || user?.profilePicture ? (
        <img
          src={previewImage || user.profilePicture}
          alt="Profile"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gray-100">
          <UserIcon className="h-16 w-16 text-gray-400" />
        </div>
      )}
    </div>
  </div>
  
  <div className="mt-4 flex gap-2">
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
        id="profile-picture"
        disabled={uploadingImage}
      />
      <label
        htmlFor="profile-picture"
        className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer ${
          uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {uploadingImage ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Uploading...
          </>
        ) : (
          'Change Photo'
        )}
      </label>
    </div>
    {(previewImage || user?.profilePicture) && (
      <button
        type="button"
        onClick={handleRemoveImage}
        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        disabled={uploadingImage}
      >
        Remove
      </button>
    )}
  </div>
</div>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isSubmitting || !isDirty ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer`}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Profile View */
          <div className="shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-indigo-600 text-white text-2xl font-medium">
                      {initial}
                    </div>
                  )}
                </div>
                <div className="ml-6">
                <h2 className="text-2xl font-bold text-gray-900">
  {user?.fullName || user?.name || 'User'}
</h2>
                  {user?.username && (
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  )}
                  {user?.points !== undefined && (
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <Star className="flex-shrink-0 mr-1.5 h-5 w-5 text-yellow-400" />
                      <span>{user.points} points</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                {user?.bio && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">About</dt>
                    <dd className="mt-1 text-sm text-white-900 whitespace-pre-line">{user.bio}</dd>
                  </div>
                )}

                {user?.location && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.location}</dd>
                  </div>
                )}

                {user?.website && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Website</dt>
                    <dd className="mt-1 text-sm">
                      <a
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    </dd>
                  </div>
                )}

                {user?.github && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">GitHub</dt>
                    <dd className="mt-1 text-sm">
                      <a
                        href={`https://github.com/${user.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {user.github}
                      </a>
                    </dd>
                  </div>
                )}

                {user?.linkedin && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">LinkedIn</dt>
                    <dd className="mt-1 text-sm">
                      <a
                        href={`https://linkedin.com/in/${user.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-500"
                      >
                        {user.linkedin}
                      </a>
                    </dd>
                  </div>
                )}

                {user?.email && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-white-900">{user.email}</dd>
                  </div>
                )}
              </dl>

              {user?.skills && user.skills.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-500">Skills</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
