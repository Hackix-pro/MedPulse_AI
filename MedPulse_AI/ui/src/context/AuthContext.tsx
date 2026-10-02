import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, PatientUser, DoctorUser } from '../types';
import { storageService } from '../services/storageService';
import { i18n, LanguageCode, Translations } from '../services/i18n';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: Role) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => void;
  resetPassword: (email: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: Translations;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [language, setLanguageState] = useState<LanguageCode>(() => storageService.getLanguage());
  const [tState, setTState] = useState<Translations>(() => i18n.t());

  useEffect(() => {
    const unsub = i18n.subscribe((newLang) => {
      setLanguageState(newLang);
      setTState(i18n.t());
    });
    return unsub;
  }, []);

  const changeLanguage = (lang: LanguageCode) => {
    i18n.setLanguage(lang);
  };

  const login = async (email: string, pass: string, expectedRole?: Role): Promise<{ success: boolean; error?: string }> => {
    // Artificial small delay for realistic UX
    await new Promise(r => setTimeout(r, 400));

    const cleanEmail = email.trim().toLowerCase();
    const users = storageService.getUsers();
    let matched = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!matched) {
      if (cleanEmail === 'patient@demo.com') {
        matched = users.find(u => u.email.toLowerCase() === 'demo@demo.com' || u.role === 'patient');
      } else if (cleanEmail === 'doctor@demo.com') {
        matched = users.find(u => u.email.toLowerCase() === 'doctor@gmail.com' || u.role === 'doctor');
      }
    }

    if (!matched) {
      return { success: false, error: 'No account found with this email. Check demo credentials or register.' };
    }

    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    // Role check if role selected
    if (expectedRole && matched.role !== expectedRole) {
      return { 
        success: false, 
        error: `This account is registered as a ${matched.role.toUpperCase()}. Please switch the role tab to ${matched.role.toUpperCase()}.` 
      };
    }

    storageService.setCurrentUser(matched);
    setUser(matched);
    return { success: true };
  };

  const signup = async (formData: any): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 500));

    const cleanEmail = formData.email?.trim().toLowerCase();
    const users = storageService.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    let newUser: User;
    if (formData.role === 'patient') {
      newUser = {
        id: `PID-${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'patient',
        email: cleanEmail,
        name: formData.name,
        mobile: formData.mobile,
        dob: formData.dob || '1995-01-01',
        gender: formData.gender || 'Male',
        bloodGroup: formData.bloodGroup || 'O+',
        preferredLanguage: formData.preferredLanguage || 'en',
        allergies: formData.allergies ? formData.allergies.split(',').map((s: string) => s.trim()) : [],
        medications: formData.medications ? formData.medications.split(',').map((s: string) => s.trim()) : [],
        medicalHistory: formData.medicalHistory ? formData.medicalHistory.split(',').map((s: string) => s.trim()) : [],
        emergencyContact: {
          name: formData.emergencyName || 'Family Contact',
          relationship: formData.emergencyRel || 'Relative',
          phone: formData.emergencyPhone || formData.mobile
        }
      } as PatientUser;
    } else {
      newUser = {
        id: `DOC-${Math.floor(10000 + Math.random() * 90000)}`,
        role: 'doctor',
        email: cleanEmail,
        name: formData.name.startsWith('Dr.') ? formData.name : `Dr. ${formData.name}`,
        mobile: formData.mobile,
        qualification: formData.qualification || 'MBBS',
        specialization: formData.specialization || 'General Physician',
        registrationNumber: formData.registrationNumber || `REG-${Date.now().toString().slice(-6)}`,
        hospital: formData.hospital || 'Independent Clinic',
        preferredLanguage: formData.preferredLanguage || 'en',
        about: formData.about || 'Consultant physician providing clinical evaluation and patient monitoring.'
      } as DoctorUser;
    }

    storageService.saveUser(newUser);
    storageService.setCurrentUser(newUser);
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    storageService.setCurrentUser(null);
    setUser(null);
  };

  const updateProfile = (updatedData: Partial<User>) => {
    if (!user) return;
    const merged = { ...user, ...updatedData } as User;
    storageService.saveUser(merged);
    storageService.setCurrentUser(merged);
    setUser(merged);
  };

  const resetPassword = async (email: string, _newPass: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise(r => setTimeout(r, 600));
    const cleanEmail = email.trim().toLowerCase();
    const users = storageService.getUsers();
    const matched = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!matched) {
      return { success: false, error: 'No account registered with this email address.' };
    }
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updateProfile,
        resetPassword,
        language,
        setLanguage: changeLanguage,
        t: tState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
