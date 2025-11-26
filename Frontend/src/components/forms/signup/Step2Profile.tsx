// components/Signup/Step2Profile.tsx
import React from 'react';
import { FormData } from './types';

interface Props {
  formData: FormData;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  errors: { [key: string]: string };
}

const skillsOptions = [
  'React',
  'Node.js',
  'Python',
  'JavaScript',
  'Tailwind',
  'Docker',
];

const Step2Profile: React.FC<Props> = ({ formData, handleChange, errors }) => {
  return (
    <div className="space-y-4">
      <div>
        <select
          name="primaryLanguage"
          value={formData.primaryLanguage}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
          required
        >
          <option value="">Select Primary Language</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Python">Python</option>
          <option value="React">React</option>
          <option value="Node.js">Node.js</option>
          <option value="Other">Other</option>
        </select>
        {errors.primaryLanguage && (
          <p className="text-red-500 text-sm mt-1">{errors.primaryLanguage}</p>
        )}
      </div>

      <div>
        <div className="flex flex-wrap gap-2">
          {skillsOptions.map((skill) => (
            <label
              key={skill}
              className={`px-3 py-1 rounded-full cursor-pointer border ${
                formData.skills.includes(skill)
                  ? 'bg-purple-500 border-purple-500'
                  : 'border-gray-600'
              }`}
            >
              <input
                type="checkbox"
                name="skills"
                value={skill}
                checked={formData.skills.includes(skill)}
                onChange={handleChange}
                className="hidden"
              />
              {skill}
            </label>
          ))}
        </div>
        {errors.skills && (
          <p className="text-red-500 text-sm mt-1">{errors.skills}</p>
        )}
      </div>

      <div>
        <input
          type="url"
          name="github"
          placeholder="GitHub / Portfolio URL"
          value={formData.github}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
        />
        {errors.github && (
          <p className="text-red-500 text-sm mt-1">{errors.github}</p>
        )}
      </div>

      <div>
        <textarea
          name="bio"
          placeholder="Short Bio"
          value={formData.bio}
          onChange={handleChange}
          className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-purple-400"
          rows={3}
          maxLength={500}
        ></textarea>
        <div className="text-right text-sm text-gray-400">
          {formData.bio.length}/500
        </div>
        {errors.bio && (
          <p className="text-red-500 text-sm mt-1">{errors.bio}</p>
        )}
      </div>
    </div>
  );
};

export default Step2Profile;
