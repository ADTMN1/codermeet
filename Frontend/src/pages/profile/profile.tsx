import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '../../components/ui/avatar';
import { FaGithub, FaLinkedin, FaGlobe, FaPlus } from 'react-icons/fa';
import UserStats from './UserStats';

export default function Profile() {
  // Profile State
  const [profileImage, setProfileImage] = useState<string | null>('/bdu.jpg');
  const [name, setName] = useState('John Doe');
  const [bio, setBio] = useState(
    'Full-stack developer passionate about building modern apps.'
  );
  const [location, setLocation] = useState('London, UK');
  const [website, setWebsite] = useState('https://myportfolio.com');
  const [github, setGithub] = useState('https://github.com/johndoe');
  const [linkedin, setLinkedin] = useState('https://linkedin.com/in/johndoe');

  // Skills
  const allSkills = [
    'React',
    'Node.js',
    'MongoDB',
    'Next.js',
    'Tailwind',
    'TypeScript',
  ];
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript']);

  const toggleSkill = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };
  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => setProfileImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const navigate = useNavigate();

  const handleSave = () => {
    const updatedProfile = {
      profileImage,
      name,
      bio,
      location,
      website,
      github,
      linkedin,
      skills,
    };

    console.log('Updated Profile:', updatedProfile);
    alert('Profile updated successfully!');
    navigate('/dashboard');
  };
  const addSkill = () => {
    const newSkill = prompt('Enter a new skill:');
    if (!newSkill) return;

    // add to available options
    if (!allSkills.includes(newSkill)) {
      allSkills.push(newSkill);
    }

    // auto-select the skill
    if (!skills.includes(newSkill)) {
      setSkills([...skills, newSkill]);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

      {/* Avatar Upload */}
      <div className="flex items-center gap-6 mb-8">
        <Avatar className="w-24 h-24">
          <AvatarImage src={profileImage || ''} />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>

        <div>
          <label className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg cursor-pointer text-white">
            Change Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>
      </div>

      <UserStats />

      {/* Form */}
      <div className="space-y-6">
        {/* Name */}
        <div>
          <label className="text-sm text-gray-400">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-sm text-gray-400">Bio</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-1"
            rows={4}
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm text-gray-400">Location</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="text-sm text-gray-400">Skills</label>

          {/* Skills List */}
          <div className="flex flex-wrap gap-2 mt-2">
            {allSkills.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1 rounded-lg border ${
                  skills.includes(skill)
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>

          {/* Add New Skill Button */}
          <div className="mt-3">
            <Button
              type="button"
              onClick={addSkill}
              variant="outline"
              size="sm"
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
            >
              <FaPlus className="w-4 h-4 mr-1" />
              Add Skill
            </Button>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <label className="text-sm text-gray-400">Social Links</label>

          <div className="grid grid-cols-1 gap-4 mt-3">
            <div className="flex items-center gap-2">
              <FaGlobe className="text-gray-400" />
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Website"
              />
            </div>

            <div className="flex items-center gap-2">
              <FaGithub className="text-gray-400" />
              <Input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="GitHub"
              />
            </div>

            <div className="flex items-center gap-2">
              <FaLinkedin className="text-gray-400" />
              <Input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="LinkedIn"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 w-full py-3 text-lg"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
