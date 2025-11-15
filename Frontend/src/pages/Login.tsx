import React from 'react';
import LoginForm from '../components/forms/LoginForm';
import Footer from '../components/layout/Public/Footer';

const Login: React.FC = () => {
  return (
    <main>
      <LoginForm />

      <Footer />
    </main>
  );
};

export default Login;
