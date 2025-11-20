import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Community: React.FC = () => {
  const [members, setMembers] = useState<
    Array<{ id: number; name: string; role: string }>
  >([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      const data = [
        { id: 1, name: 'Alice', role: 'Mentor' },
        { id: 2, name: 'Bob', role: 'Mentee' },
        { id: 3, name: 'Charlie', role: 'Developer' },
      ];
      setMembers(data);
    };
    fetchMembers();
  }, []);
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Community Members</h1>
      <ul className="space-y-4">
        {members.map((member) => (
          <li key={member.id} className="p-4 bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold">{member.name}</h2>
            <p className="text-gray-400">{member.role}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Community;
