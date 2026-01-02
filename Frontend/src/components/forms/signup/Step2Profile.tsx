// components/Signup/Step2Profile.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  FaGithub, FaCode, FaLaptopCode, FaPalette, FaServer, FaDatabase, FaGitAlt, FaLink, 
  FaSearch, FaChevronDown, FaChevronUp, FaCheckCircle, FaExclamationCircle,
  FaStar, FaTrophy, FaRocket, FaFire, FaBolt, FaGem, FaCrown, FaMedal,
  FaGripVertical, FaPlus, FaTimes, FaEdit, FaSave, FaUndo, FaRedo,
  FaHtml5, FaCss3Alt, FaJsSquare, FaReact, FaNodeJs, FaPython, FaJava,
  FaDocker, FaAws, FaGoogle, FaGit, FaNpm, FaYarn, FaVuejs, FaAngular
} from 'react-icons/fa';
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

interface Skill {
  name: string;
  icon: any;
  color: string;
  category: string;
  trending?: boolean;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  description: string;
}

interface SkillWithProficiency extends Skill {
  proficiency: 1 | 2 | 3 | 4 | 5;
  years?: number;
}

const skillsDatabase: Skill[] = [
  // Frontend
  { name: 'React', icon: FaReact, color: 'cyan', category: 'Frontend', trending: true, difficulty: 'Intermediate', description: 'Modern UI library for building user interfaces' },
  { name: 'Vue.js', icon: FaVuejs, color: 'green', category: 'Frontend', difficulty: 'Beginner', description: 'Progressive JavaScript framework' },
  { name: 'Angular', icon: FaAngular, color: 'red', category: 'Frontend', difficulty: 'Advanced', description: 'Full-featured TypeScript framework' },
  { name: 'JavaScript', icon: FaJsSquare, color: 'yellow', category: 'Frontend', difficulty: 'Beginner', description: 'Core programming language of the web' },
  { name: 'TypeScript', icon: FaCode, color: 'blue', category: 'Frontend', trending: true, difficulty: 'Intermediate', description: 'Typed superset of JavaScript' },
  { name: 'HTML5', icon: FaHtml5, color: 'orange', category: 'Frontend', difficulty: 'Beginner', description: 'Modern markup language for web content' },
  { name: 'CSS3', icon: FaCss3Alt, color: 'blue', category: 'Frontend', difficulty: 'Beginner', description: 'Styling language for web presentation' },
  { name: 'Tailwind CSS', icon: FaPalette, color: 'cyan', category: 'Frontend', trending: true, difficulty: 'Intermediate', description: 'Utility-first CSS framework' },
  { name: 'Next.js', icon: FaReact, color: 'black', category: 'Frontend', trending: true, difficulty: 'Intermediate', description: 'React framework for production' },
  
  // Backend
  { name: 'Node.js', icon: FaNodeJs, color: 'green', category: 'Backend', trending: true, difficulty: 'Intermediate', description: 'JavaScript runtime for server-side development' },
  { name: 'Python', icon: FaPython, color: 'blue', category: 'Backend', difficulty: 'Beginner', description: 'Versatile programming language' },
  { name: 'Java', icon: FaJava, color: 'orange', category: 'Backend', difficulty: 'Advanced', description: 'Enterprise-grade programming language' },
  { name: 'Express.js', icon: FaNodeJs, color: 'gray', category: 'Backend', difficulty: 'Intermediate', description: 'Web application framework for Node.js' },
  { name: 'Django', icon: FaPython, color: 'green', category: 'Backend', difficulty: 'Intermediate', description: 'High-level Python web framework' },
  { name: 'Go', icon: FaCode, color: 'cyan', category: 'Backend', trending: true, difficulty: 'Advanced', description: 'Concurrent programming language' },
  { name: 'Rust', icon: FaCode, color: 'orange', category: 'Backend', trending: true, difficulty: 'Expert', description: 'Systems programming language' },
  
  // Database
  { name: 'MongoDB', icon: FaDatabase, color: 'green', category: 'Database', difficulty: 'Intermediate', description: 'NoSQL document database' },
  { name: 'PostgreSQL', icon: FaDatabase, color: 'blue', category: 'Database', difficulty: 'Intermediate', description: 'Advanced relational database' },
  { name: 'MySQL', icon: FaDatabase, color: 'orange', category: 'Database', difficulty: 'Beginner', description: 'Popular relational database' },
  { name: 'Redis', icon: FaDatabase, color: 'red', category: 'Database', difficulty: 'Intermediate', description: 'In-memory data structure store' },
  
  // DevOps & Cloud
  { name: 'Docker', icon: FaDocker, color: 'blue', category: 'DevOps', trending: true, difficulty: 'Intermediate', description: 'Container platform for applications' },
  { name: 'AWS', icon: FaAws, color: 'orange', category: 'DevOps', difficulty: 'Advanced', description: 'Amazon Web Services cloud platform' },
  { name: 'Google Cloud', icon: FaGoogle, color: 'blue', category: 'DevOps', difficulty: 'Advanced', description: 'Google Cloud Platform services' },
  { name: 'Kubernetes', icon: FaDocker, color: 'blue', category: 'DevOps', difficulty: 'Expert', description: 'Container orchestration platform' },
  
  // Tools
  { name: 'Git', icon: FaGit, color: 'red', category: 'Tools', difficulty: 'Beginner', description: 'Version control system' },
  { name: 'NPM', icon: FaNpm, color: 'red', category: 'Tools', difficulty: 'Beginner', description: 'Package manager for JavaScript' },
  { name: 'Yarn', icon: FaYarn, color: 'blue', category: 'Tools', difficulty: 'Beginner', description: 'Fast, reliable, and secure dependency management' },
];

const proficiencyLevels = [
  { level: 1, label: 'Beginner', icon: FaStar, color: 'gray' },
  { level: 2, label: 'Novice', icon: FaStar, color: 'blue' },
  { level: 3, label: 'Intermediate', icon: FaStar, color: 'green' },
  { level: 4, label: 'Advanced', icon: FaStar, color: 'orange' },
  { level: 5, label: 'Expert', icon: FaStar, color: 'red' },
];

const Step2Profile: React.FC<Props> = ({ formData, handleChange, errors }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedSkill, setDraggedSkill] = useState<SkillWithProficiency | null>(null);

  // Initialize selectedSkills from formData.skills
  const selectedSkills = useMemo(() => {
    return formData.skills.map(skillName => {
      const skill = skillsDatabase.find(s => s.name === skillName);
      return skill ? { ...skill, proficiency: 3 } : null;
    }).filter(Boolean) as SkillWithProficiency[];
  }, [formData.skills]);

  const updateSkills = (newSkills: SkillWithProficiency[]) => {
    const skillNames = newSkills.map(s => s.name);
    // Create a proper synthetic event that matches ChangeEvent interface
    const syntheticEvent = {
      target: {
        name: 'skills',
        value: skillNames,
        type: 'text'
      },
      currentTarget: {
        name: 'skills',
        value: skillNames,
        type: 'text'
      },
      nativeEvent: new Event('change'),
      bubbles: true,
      cancelable: true,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      preventDefault: () => {},
      stopPropagation: () => {},
      timeStamp: Date.now(),
      type: 'change'
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  const categories = useMemo(() => ['All', 'Frontend', 'Backend', 'Database', 'DevOps', 'Tools'], []);
  
  const filteredSkills = useMemo(() => {
    return skillsDatabase.filter(skill => {
      const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           skill.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || skill.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const trendingSkills = useMemo(() => {
    return skillsDatabase.filter(skill => skill.trending);
  }, []);

  const addSkill = (skill: Skill) => {
    const existingIndex = selectedSkills.findIndex(s => s.name === skill.name);
    if (existingIndex === -1 && selectedSkills.length < 10) {
      const newSkills = [...selectedSkills, { ...skill, proficiency: 3 as 1 | 2 | 3 | 4 | 5 }];
      updateSkills(newSkills);
    }
  };

  const removeSkill = (skillName: string) => {
    const newSkills = selectedSkills.filter(s => s.name !== skillName);
    updateSkills(newSkills);
  };

  const updateProficiency = (skillName: string, proficiency: 1 | 2 | 3 | 4 | 5) => {
    const newSkills = selectedSkills.map(s => 
      s.name === skillName ? { ...s, proficiency } : s
    );
    updateSkills(newSkills);
  };

  const moveSkill = (fromIndex: number, toIndex: number) => {
    const newSkills = [...selectedSkills];
    const [moved] = newSkills.splice(fromIndex, 1);
    newSkills.splice(toIndex, 0, moved);
    updateSkills(newSkills);
  };

  const handleDragStart = (skill: SkillWithProficiency) => {
    setIsDragging(true);
    setDraggedSkill(skill);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedSkill(null);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedSkill) {
      const fromIndex = selectedSkills.findIndex(s => s.name === draggedSkill.name);
      if (fromIndex !== -1 && fromIndex !== targetIndex) {
        moveSkill(fromIndex, targetIndex);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent mb-2">
          Build Your Developer Profile
        </h2>
        <p className="text-gray-400 text-lg">Showcase your technical expertise and stand out</p>
      </div>
      
      {/* Primary Language */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 shadow-xl">
        <label className="block text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
          <FaLaptopCode className="text-purple-400" />
          Primary Programming Language
        </label>
        <div className="relative">
          <FaLaptopCode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          <select
            name="primaryLanguage"
            value={formData.primaryLanguage}
            onChange={handleChange}
            className="w-full pl-12 pr-10 py-3 rounded-lg bg-gray-700/50 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 border border-gray-600 focus:border-purple-400 transition-all duration-300 appearance-none cursor-pointer"
            required
          >
            <option value="">Select your primary language</option>
            <option value="JavaScript">JavaScript</option>
            <option value="TypeScript">TypeScript</option>
            <option value="Python">Python</option>
            <option value="React">React</option>
            <option value="Node.js">Node.js</option>
            <option value="Java">Java</option>
            <option value="Go">Go</option>
            <option value="Other">Other</option>
          </select>
          <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        {errors.primaryLanguage && (
          <p className="text-red-400 text-sm mt-2 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.primaryLanguage}
          </p>
        )}
      </div>

      {/* Skills Selection */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-purple-400 flex items-center gap-2">
            <FaTrophy className="text-purple-400" />
            Your Technical Skills
          </h3>
          <span className="text-sm text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
            {selectedSkills.length}/10 skills selected
          </span>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 whitespace-nowrap transform hover:scale-105 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 border border-purple-400'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600 border border-gray-600 hover:border-purple-500/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills or technologies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* Trending Skills */}
        {trendingSkills.length > 0 && searchTerm === '' && selectedCategory === 'All' && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <FaFire className="text-orange-400" />
              Trending Technologies
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {trendingSkills.map(skill => {
                const Icon = skill.icon;
                const isSelected = selectedSkills.some(s => s.name === skill.name);
                return (
                  <button
                    key={skill.name}
                    onClick={() => !isSelected && addSkill(skill)}
                    disabled={isSelected}
                    className={`relative p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? 'bg-purple-500/20 border-purple-500 cursor-not-allowed'
                        : 'bg-gray-700 border-gray-600 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`text-xl ${isSelected ? 'text-purple-400' : `text-${skill.color}-400`}`} />
                      <div className="text-left">
                        <div className={`text-sm font-medium ${isSelected ? 'text-purple-300' : 'text-gray-300'}`}>
                          {skill.name}
                        </div>
                        <div className="text-xs text-gray-500">{skill.category}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <FaCheckCircle className="absolute top-2 right-2 text-green-400 text-sm" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Skills */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {filteredSkills.map(skill => {
            const Icon = skill.icon;
            const isSelected = selectedSkills.some(s => s.name === skill.name);
            return (
              <button
                key={skill.name}
                onClick={() => !isSelected && addSkill(skill)}
                disabled={isSelected}
                className={`relative p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                  isSelected
                    ? 'bg-purple-500/20 border-purple-500 cursor-not-allowed'
                    : 'bg-gray-700 border-gray-600 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`text-xl ${isSelected ? 'text-purple-400' : `text-${skill.color}-400`}`} />
                  <div className="text-left">
                    <div className={`text-sm font-medium ${isSelected ? 'text-purple-300' : 'text-gray-300'}`}>
                      {skill.name}
                    </div>
                    <div className="text-xs text-gray-500">{skill.difficulty}</div>
                  </div>
                </div>
                {isSelected && (
                  <FaCheckCircle className="absolute top-2 right-2 text-green-400 text-sm" />
                )}
              </button>
            );
          })}
        </div>

        {errors.skills && (
          <p className="text-red-500 text-sm mt-3 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.skills}
          </p>
        )}
      </div>

      {/* Selected Skills with Proficiency */}
      {selectedSkills.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-gray-300 mb-6 flex items-center gap-2">
            <FaCrown className="text-yellow-400" />
            Your Skill Stack
          </h3>
          
          <div className="space-y-3">
            {selectedSkills.map((skill, index) => {
              const Icon = skill.icon;
              const proficiencyLevel = proficiencyLevels.find(p => p.level === skill.proficiency);
              return (
                <div
                  key={skill.name}
                  draggable
                  onDragStart={() => handleDragStart(skill)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    isDragging && draggedSkill?.name === skill.name
                      ? 'opacity-50 border-purple-400'
                      : 'bg-gray-700 border-gray-600 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaGripVertical className="text-gray-400 cursor-move" />
                      <Icon className={`text-2xl text-${skill.color}-400`} />
                      <div>
                        <div className="font-medium text-gray-200">{skill.name}</div>
                        <div className="text-sm text-gray-400">{skill.category} • {skill.difficulty}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Proficiency Selector */}
                      <div className="flex items-center gap-1">
                        {proficiencyLevels.map(level => (
                          <button
                            key={level.level}
                            onClick={() => updateProficiency(skill.name, level.level as 1 | 2 | 3 | 4 | 5)}
                            className={`p-1 transition-all duration-200 ${
                              skill.proficiency >= level.level
                                ? `text-${level.color}-400 scale-110`
                                : 'text-gray-600 hover:text-gray-400'
                            }`}
                          >
                            <level.icon className="text-sm" />
                          </button>
                        ))}
                        <span className="text-xs text-gray-400 ml-2">{proficiencyLevel?.label}</span>
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeSkill(skill.name)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* GitHub/Portfolio */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-3">GitHub / Portfolio</label>
        <div className="relative">
          <FaGithub className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
          <input
            type="url"
            name="github"
            placeholder="https://github.com/yourusername"
            value={formData.github}
            onChange={handleChange}
            required
            className="w-full pl-12 pr-3 py-3 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300"
          />
        </div>
        {errors.github && (
          <p className="text-red-500 text-sm mt-2 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.github}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <label className="block text-sm font-medium text-gray-300 mb-3">Professional Bio</label>
        <div className="relative">
          <textarea
            name="bio"
            placeholder="Tell us about your experience, projects, and what makes you passionate about development..."
            value={formData.bio}
            onChange={handleChange}
            className="w-full p-4 rounded-lg bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-300 resize-none"
            rows={4}
            maxLength={500}
          ></textarea>
          <div className={`absolute bottom-3 right-3 text-xs font-medium transition-colors duration-300 ${
            formData.bio.length > 450 ? 'text-orange-400' : 
            formData.bio.length > 400 ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {formData.bio.length}/500
          </div>
        </div>
        {errors.bio && (
          <p className="text-red-500 text-sm mt-2 animate-pulse flex items-center gap-1">
            <FaExclamationCircle className="text-xs" />
            {errors.bio}
          </p>
        )}
      </div>
    </div>
  );
};

export default Step2Profile;
