'use client';

import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Facebook,
  Globe2,
  Instagram,
  Languages,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Store,
  User,
  Users,
  X,
} from 'lucide-react';

import { supabase } from '@/app/lib/supabase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/* ============================================================================
   TYPES
============================================================================ */

export type AgentPlanTier =
  | 'free'
  | 'pro'
  | 'premium'
  | 'agent_pro';

export type BusinessHoursDay = {
  enabled: boolean;
  open: string;
  close: string;
};

export type AgentBusinessHours = {
  monday: BusinessHoursDay;
  tuesday: BusinessHoursDay;
  wednesday: BusinessHoursDay;
  thursday: BusinessHoursDay;
  friday: BusinessHoursDay;
  saturday: BusinessHoursDay;
  sunday: BusinessHoursDay;
};

export interface AgentProfileData {
  uid: string;

  name: string;
  agencyName: string;
  professionalTitle: string;
  accountType: string;

  planTier: AgentPlanTier;
  isVerified: boolean;

  email: string;
  phone: string;
  whatsappNumber: string;
  secondaryPhone: string;
  website: string;

  country: string;
  region: string;
  city: string;
  district: string;
  officeAddress: string;

  bio: string;
  yearsOfExperience: string;

  specialties: string;
  services: string;
  languages: string;
  serviceAreas: string;

  responseTime: string;

  availableForTours: boolean;
  acceptingClients: boolean;

  licenseNumber: string;
  businessRegistrationNumber: string;
  certifications: string;

  facebook: string;
  instagram: string;
  tiktok: string;
  linkedin: string;

  businessHours: AgentBusinessHours;

  showPhone: boolean;
  showWhatsApp: boolean;
  showEmail: boolean;
  showAddress: boolean;
  showBusinessHours: boolean;

  profileImageUrl: string;
  coverPhoto: string;
}

export interface EditAgentProfileProps {
  profile: Partial<AgentProfileData> & {
    uid: string;
  };

  onSaved?: (updatedProfile: AgentProfileData) => void;

  onCancel?: () => void;

  className?: string;
}

/* ============================================================================
   DEFAULTS
============================================================================ */

const DEFAULT_DAY: BusinessHoursDay = {
  enabled: false,
  open: '08:00',
  close: '18:00',
};

const DEFAULT_BUSINESS_HOURS: AgentBusinessHours = {
  monday: { ...DEFAULT_DAY, enabled: true },
  tuesday: { ...DEFAULT_DAY, enabled: true },
  wednesday: { ...DEFAULT_DAY, enabled: true },
  thursday: { ...DEFAULT_DAY, enabled: true },
  friday: { ...DEFAULT_DAY, enabled: false },
  saturday: { ...DEFAULT_DAY, enabled: true },
  sunday: { ...DEFAULT_DAY, enabled: false },
};

const DEFAULT_PROFILE: AgentProfileData = {
  uid: '',

  name: '',
  agencyName: '',
  professionalTitle: '',
  accountType: 'Real Estate Agent',

  planTier: 'free',
  isVerified: false,

  email: '',
  phone: '',
  whatsappNumber: '',
  secondaryPhone: '',
  website: '',

  country: '',
  region: '',
  city: '',
  district: '',
  officeAddress: '',

  bio: '',
  yearsOfExperience: '',

  specialties: '',
  services: '',
  languages: '',
  serviceAreas: '',

  responseTime: 'Within a few hours',

  availableForTours: true,
  acceptingClients: true,

  licenseNumber: '',
  businessRegistrationNumber: '',
  certifications: '',

  facebook: '',
  instagram: '',
  tiktok: '',
  linkedin: '',

  businessHours: DEFAULT_BUSINESS_HOURS,

  showPhone: true,
  showWhatsApp: true,
  showEmail: false,
  showAddress: true,
  showBusinessHours: true,

  profileImageUrl: '',
  coverPhoto: '',
};

/* ============================================================================
   HELPERS
============================================================================ */

function stringValue(value: unknown): string {
  if (typeof value === 'string') return value;

  if (value === null || value === undefined) return '';

  return String(value);
}

function booleanValue(
  value: unknown,
  fallback = false,
): boolean {
  if (typeof value === 'boolean') return value;

  if (value === 'true') return true;

  if (value === 'false') return false;

  return fallback;
}

function arrayToString(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(', ');
  }

  return stringValue(value);
}

function stringToArray(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePlanTier(value: unknown): AgentPlanTier {
  const tier = stringValue(value).toLowerCase().trim();

  if (tier === 'pro') return 'pro';
  if (tier === 'premium') return 'premium';
  if (tier === 'agent_pro' || tier === 'agentpro') return 'agent_pro';

  return 'free';
}

function normalizeBusinessHours(
  value: unknown,
): AgentBusinessHours {
  if (!value || typeof value !== 'object') {
    return DEFAULT_BUSINESS_HOURS;
  }

  const input = value as Partial<AgentBusinessHours>;

  const createDay = (
    day: keyof AgentBusinessHours,
  ): BusinessHoursDay => {
    const source = input[day];

    if (!source) {
      return {
        ...DEFAULT_DAY,
        ...DEFAULT_BUSINESS_HOURS[day],
      };
    }

    return {
      enabled: booleanValue(
        source.enabled,
        DEFAULT_BUSINESS_HOURS[day].enabled,
      ),
      open: stringValue(source.open) || '08:00',
      close: stringValue(source.close) || '18:00',
    };
  };

  return {
    monday: createDay('monday'),
    tuesday: createDay('tuesday'),
    wednesday: createDay('wednesday'),
    thursday: createDay('thursday'),
    friday: createDay('friday'),
    saturday: createDay('saturday'),
    sunday: createDay('sunday'),
  };
}

function normalizeProfile(
  source: Partial<AgentProfileData> & {
    uid: string;
  },
): AgentProfileData {
  const profile = source as Record<string, unknown>;

  return {
    ...DEFAULT_PROFILE,

    uid: source.uid,

    name:
      stringValue(profile.name) ||
      stringValue(profile.displayName) ||
      stringValue(profile.ownerName),

    agencyName:
      stringValue(profile.agencyName) ||
      stringValue(profile.businessName),

    professionalTitle: stringValue(
      profile.professionalTitle,
    ),

    accountType:
      stringValue(profile.accountType) ||
      'Real Estate Agent',

    planTier:
      normalizePlanTier(profile.planTier),

    isVerified:
      booleanValue(profile.isVerified) ||
      booleanValue(profile.agentVerified),

    email: stringValue(profile.email),

    phone:
      stringValue(profile.phone) ||
      stringValue(profile.phoneNumber),

    whatsappNumber:
      stringValue(profile.whatsappNumber) ||
      stringValue(profile.whatsapp),

    secondaryPhone: stringValue(
      profile.secondaryPhone,
    ),

    website: stringValue(profile.website),

    country: stringValue(profile.country),

    region:
      stringValue(profile.region) ||
      stringValue(profile.state),

    city: stringValue(profile.city),

    district:
      stringValue(profile.district) ||
      stringValue(profile.area),

    officeAddress:
      stringValue(profile.officeAddress) ||
      stringValue(profile.address),

    bio:
      stringValue(profile.bio) ||
      stringValue(profile.description),

    yearsOfExperience: stringValue(
      profile.yearsOfExperience,
    ),

    specialties: arrayToString(
      profile.specialties,
    ),

    services: arrayToString(
      profile.services,
    ),

    languages: arrayToString(
      profile.languages,
    ),

    serviceAreas: arrayToString(
      profile.serviceAreas,
    ),

    responseTime:
      stringValue(profile.responseTime) ||
      'Within a few hours',

    availableForTours:
      profile.availableForTours === undefined
        ? true
        : booleanValue(
            profile.availableForTours,
            true,
          ),

    acceptingClients:
      profile.acceptingClients === undefined
        ? true
        : booleanValue(
            profile.acceptingClients,
            true,
          ),

    licenseNumber: stringValue(
      profile.licenseNumber,
    ),

    businessRegistrationNumber:
      stringValue(
        profile.businessRegistrationNumber,
      ),

    certifications: arrayToString(
      profile.certifications,
    ),

    facebook: stringValue(profile.facebook),

    instagram: stringValue(
      profile.instagram,
    ),

    tiktok: stringValue(profile.tiktok),

    linkedin: stringValue(
      profile.linkedin,
    ),

    businessHours:
      profile.businessHours
        ? normalizeBusinessHours(
            profile.businessHours,
          )
        : DEFAULT_BUSINESS_HOURS,

    showPhone:
      profile.showPhone === undefined
        ? true
        : booleanValue(profile.showPhone, true),

    showWhatsApp:
      profile.showWhatsApp === undefined
        ? true
        : booleanValue(
            profile.showWhatsApp,
            true,
          ),

    showEmail:
      profile.showEmail === undefined
        ? false
        : booleanValue(profile.showEmail),

    showAddress:
      profile.showAddress === undefined
        ? true
        : booleanValue(
            profile.showAddress,
            true,
          ),

    showBusinessHours:
      profile.showBusinessHours === undefined
        ? true
        : booleanValue(
            profile.showBusinessHours,
            true,
          ),

    profileImageUrl:
      stringValue(profile.profileImageUrl) ||
      stringValue(profile.photoUrl),

    coverPhoto:
      stringValue(profile.coverPhoto) ||
      stringValue(profile.coverPhotoUrl),
  };
}

/* ============================================================================
   MAIN COMPONENT
============================================================================ */

export default function EditAgentProfile({
  profile,
  onSaved,
  onCancel,
  className = '',
}: EditAgentProfileProps) {
  const [form, setForm] = useState<AgentProfileData>(
    () => normalizeProfile(profile),
  );

  const [saving, setSaving] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState<'profile' | 'cover' | null>(null);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  const [activeSection, setActiveSection] =
    useState('identity');

  useEffect(() => {
    setForm(normalizeProfile(profile));
  }, [profile]);

  const isPro = useMemo(() => {
    return [
      'pro',
      'premium',
      'agent_pro',
    ].includes(form.planTier);
  }, [form.planTier]);

  const updateField = <
    K extends keyof AgentProfileData,
  >(
    field: K,
    value: AgentProfileData[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess('');

    setError('');
  };

  const updateBusinessHour = (
    day: keyof AgentBusinessHours,
    field: keyof BusinessHoursDay,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,

      businessHours: {
        ...current.businessHours,

        [day]: {
          ...current.businessHours[day],
          [field]: value,
        },
      },
    }));
  };

  const uploadAgentPhoto = async (
    file: File,
    type: 'profile' | 'cover',
  ) => {
    setError('');
    setSuccess('');

    if (!form.uid) {
      setError('Agent account ID is missing. Please refresh the page and try again.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const maxSize = type === 'profile' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        type === 'profile'
          ? 'Profile photo must be 5MB or smaller.'
          : 'Cover photo must be 10MB or smaller.',
      );
      return;
    }

    setUploadingPhoto(type);

    try {
      const storage = getStorage();
      const extension =
        file.name.split('.').pop()?.toLowerCase() || 'jpg';

      const safeExtension = extension.replace(/[^a-z0-9]/g, '') || 'jpg';
      const fileName = `${type}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${safeExtension}`;

      const storagePath = `agent-profiles/${form.uid}/${fileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file, {
        contentType: file.type,
        cacheControl: 'public,max-age=31536000,immutable',
      });

      const downloadUrl = await getDownloadURL(storageRef);

      if (type === 'profile') {
        updateField('profileImageUrl', downloadUrl);

        // Keep the existing agent profile record synchronized immediately.
        const { error: profileImageError } = await supabase
          .from('agents')
          .update({
            profileImageUrl: downloadUrl,
            lastUpdated: new Date().toISOString(),
          })
          .eq('_id', form.uid);

        if (profileImageError) {
          throw profileImageError;
        }

        setSuccess('Profile photo uploaded successfully.');
      } else {
        updateField('coverPhoto', downloadUrl);

        const { error: coverImageError } = await supabase
          .from('agents')
          .update({
            coverPhoto: downloadUrl,
            lastUpdated: new Date().toISOString(),
          })
          .eq('_id', form.uid);

        if (coverImageError) {
          throw coverImageError;
        }

        setSuccess('Cover photo uploaded successfully.');
      }
    } catch (uploadError) {
      console.error('Agent photo upload failed:', uploadError);

      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Failed to upload photo.';

      setError(
        message.includes('storage')
          ? 'Photo upload failed. Please check Firebase Storage configuration and rules.'
          : message,
      );
    } finally {
      setUploadingPhoto(null);
    }
  };

  const validateForm = (): string | null => {
    if (!form.uid.trim()) {
      return 'Agent account ID is missing.';
    }

    if (!form.name.trim()) {
      return 'Display Name is required.';
    }

    if (!form.agencyName.trim()) {
      return 'Agency / Business Name is required.';
    }

    if (!form.phone.trim()) {
      return 'Primary phone number is required.';
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim(),
      )
    ) {
      return 'Please enter a valid email address.';
    }

    if (
      form.website.trim() &&
      !/^https?:\/\//i.test(form.website.trim())
    ) {
      return 'Website must start with http:// or https://.';
    }

    return null;
  };

  const buildDatabasePayload = () => {
    /*
      Only send columns that are present in the current `agents`
      database structure. The UI can still contain the additional
      profile fields, but unsupported columns must not be sent to
      Supabase because PostgREST will reject the request.
    */
    return {
      name: form.name.trim(),
      ownerName: form.name.trim(),
      agencyName: form.agencyName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      whatsappNumber: form.whatsappNumber.trim(),
      city: form.city.trim(),
      bio: form.bio.trim(),
      specialties: stringToArray(form.specialties),
      languages: stringToArray(form.languages),
      licenseNumber: form.licenseNumber.trim(),
      profileImageUrl: form.profileImageUrl.trim(),
      coverPhoto: form.coverPhoto.trim(),
      lastUpdated: new Date().toISOString(),
    };
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError('');

    setSuccess('');

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });

      return;
    }

    setSaving(true);

    try {
      const payload =
        buildDatabasePayload();

      const { data, error: updateError } =
        await supabase
          .from('agents')
          .update(payload)
          .eq('_id', form.uid)
          .select('*')
          .single();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error(
          'Profile was not returned after saving.',
        );
      }

      const updatedProfile =
        normalizeProfile({
          ...(data as Partial<AgentProfileData>),
          uid: form.uid,
        });

      setForm(updatedProfile);

      setSuccess(
        'Your agent profile has been updated successfully.',
      );

      onSaved?.(updatedProfile);

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (saveError) {
      console.error(
        'Agent profile update failed:',
        saveError,
      );

      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save agent profile.';

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#F8FAFC] ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">

        {/* ================================================================
            TOP HEADER
        ================================================================ */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#0065EB]">
              <SettingsIcon />

              Agent Profile
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Edit Profile
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              Manage the professional information customers see
              on your GuriUp agent profile.
            </p>
          </div>

          <div className="flex items-center gap-3">

            {form.isVerified && (
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
                <BadgeCheck size={16} />

                Verified
              </div>
            )}

            <div
              className={`
                rounded-full px-4 py-2 text-xs font-black
                uppercase tracking-widest
                ${
                  isPro
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }
              `}
            >
              {isPro
                ? 'Pro Agent'
                : 'Free Agent'}
            </div>
          </div>
        </div>

        {/* ================================================================
            ALERTS
        ================================================================ */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-black">
                Unable to save profile
              </p>

              <p className="mt-1 text-sm font-medium">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError('')}
              className="ml-auto rounded-lg p-1 hover:bg-red-100"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check size={18} />
            </div>

            <div>
              <p className="font-black">
                Profile saved
              </p>

              <p className="text-sm font-medium">
                {success}
              </p>
            </div>
          </div>
        )}

        {/* ================================================================
            PROFILE HERO
        ================================================================ */}

        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">

          <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#0065EB] via-[#155EEF] to-[#172554] md:h-56">

            {form.coverPhoto ? (
              <img
                src={form.coverPhoto}
                alt="Agent cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full bg-white/10 blur-2xl" />

                <div className="absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.18),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,.12),transparent_28%)]" />
              </>
            )}

            <div className="absolute inset-0 bg-black/10" />

            <div className="absolute bottom-5 right-5 rounded-xl border border-white/20 bg-black/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              Public Agent Profile
            </div>
          </div>

          <div className="relative px-5 pb-7 md:px-8">

            <div className="-mt-14 flex flex-col gap-5 md:-mt-16 md:flex-row md:items-end">

              <div className="relative shrink-0">

                <div className="h-28 w-28 overflow-hidden rounded-[2rem] border-[6px] border-white bg-slate-100 shadow-xl md:h-32 md:w-32">

                  {form.profileImageUrl ? (
                    <img
                      src={form.profileImageUrl}
                      alt={form.name || 'Agent'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User
                        size={48}
                        className="text-slate-300"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 pb-1">

                <div className="flex flex-wrap items-center gap-2">

                  <h2 className="truncate text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    {form.name || 'Agent Name'}
                  </h2>

                  {form.isVerified && (
                    <BadgeCheck
                      size={23}
                      className="fill-blue-500 text-white"
                    />
                  )}
                </div>

                <p className="mt-1 text-sm font-bold text-slate-500">
                  {form.agencyName ||
                    'Agency / Business Name'}
                </p>

                {form.professionalTitle && (
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {form.professionalTitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            SECTION NAVIGATION
        ================================================================ */}

        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex min-w-max gap-1">

            {[
              {
                id: 'identity',
                label: 'Identity',
                icon: Building2,
              },
              {
                id: 'contact',
                label: 'Contact',
                icon: Phone,
              },
              {
                id: 'location',
                label: 'Location',
                icon: MapPin,
              },
              {
                id: 'about',
                label: 'About',
                icon: User,
              },
              {
                id: 'business',
                label: 'Business',
                icon: BriefcaseBusiness,
              },
              {
                id: 'credentials',
                label: 'Credentials',
                icon: Award,
              },
              {
                id: 'social',
                label: 'Social',
                icon: Globe2,
              },
              {
                id: 'visibility',
                label: 'Visibility',
                icon: ShieldCheck,
              },
            ].map((item) => {
              const Icon = item.icon;

              const active =
                activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setActiveSection(item.id)
                  }
                  className={`
                    inline-flex items-center gap-2 rounded-xl
                    px-4 py-3 text-xs font-black transition-all
                    ${
                      active
                        ? 'bg-slate-950 text-white shadow-md'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon size={15} />

                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* ================================================================
              IDENTITY
          ================================================================ */}

          {activeSection === 'identity' && (
            <SectionCard
              icon={<Building2 size={21} />}
              title="Business Identity"
              description="The core identity customers see when visiting your agent profile."
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <Field
                  label="Display Name"
                  required
                  value={form.name}
                  onChange={(value) =>
                    updateField('name', value)
                  }
                  placeholder="e.g. GuriUp Jigjiga"
                />

                <Field
                  label="Agency / Business Name"
                  required
                  value={form.agencyName}
                  onChange={(value) =>
                    updateField(
                      'agencyName',
                      value,
                    )
                  }
                  placeholder="e.g. GuriUp Jigjiga Real Estate"
                />

                <Field
                  label="Professional Title"
                  value={form.professionalTitle}
                  onChange={(value) =>
                    updateField(
                      'professionalTitle',
                      value,
                    )
                  }
                  placeholder="e.g. Real Estate Agent"
                />

                <SelectField
                  label="Account Type"
                  value={form.accountType}
                  onChange={(value) =>
                    updateField(
                      'accountType',
                      value,
                    )
                  }
                  options={[
                    'Real Estate Agent',
                    'Real Estate Agency',
                    'Property Manager',
                    'Real Estate Consultant',
                    'Broker',
                    'Developer',
                  ]}
                />

                <div className="md:col-span-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <PhotoUploadCard
                    label="Profile Photo"
                    description="Upload the main photo customers see on your agent profile."
                    imageUrl={form.profileImageUrl}
                    uploading={uploadingPhoto === 'profile'}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    aspectClass="aspect-square"
                    onFileSelected={(file) =>
                      uploadAgentPhoto(file, 'profile')
                    }
                    onRemove={() => {
                      updateField('profileImageUrl', '');
                      setSuccess('');
                    }}
                  />

                  <PhotoUploadCard
                    label="Cover Photo"
                    description="Upload a wide professional image for your profile header."
                    imageUrl={form.coverPhoto}
                    uploading={uploadingPhoto === 'cover'}
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    aspectClass="aspect-[16/6]"
                    onFileSelected={(file) =>
                      uploadAgentPhoto(file, 'cover')
                    }
                    onRemove={() => {
                      updateField('coverPhoto', '');
                      setSuccess('');
                    }}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              CONTACT
          ================================================================ */}

          {activeSection === 'contact' && (
            <SectionCard
              icon={<Phone size={21} />}
              title="Contact Information"
              description="How clients can communicate directly with the agent or agency."
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <Field
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField(
                      'email',
                      value,
                    )
                  }
                  placeholder="agent@example.com"
                  icon={<Mail size={17} />}
                />

                <Field
                  label="Primary Phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(value) =>
                    updateField(
                      'phone',
                      value,
                    )
                  }
                  placeholder="+251..."
                  icon={<Phone size={17} />}
                />

                <Field
                  label="WhatsApp Number"
                  type="tel"
                  value={form.whatsappNumber}
                  onChange={(value) =>
                    updateField(
                      'whatsappNumber',
                      value,
                    )
                  }
                  placeholder="+251..."
                  icon={
                    <MessageCircle
                      size={17}
                    />
                  }
                />

                <Field
                  label="Secondary Phone"
                  type="tel"
                  value={form.secondaryPhone}
                  onChange={(value) =>
                    updateField(
                      'secondaryPhone',
                      value,
                    )
                  }
                  placeholder="+251..."
                  icon={<Phone size={17} />}
                />

                <div className="md:col-span-2">
                  <Field
                    label="Website"
                    value={form.website}
                    onChange={(value) =>
                      updateField(
                        'website',
                        value,
                      )
                    }
                    placeholder="https://example.com"
                    icon={
                      <Globe2 size={17} />
                    }
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              LOCATION
          ================================================================ */}

          {activeSection === 'location' && (
            <SectionCard
              icon={<MapPin size={21} />}
              title="Office & Location"
              description="Where the agent or agency operates. This is agent information, not a property listing."
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <Field
                  label="Country"
                  value={form.country}
                  onChange={(value) =>
                    updateField(
                      'country',
                      value,
                    )
                  }
                  placeholder="e.g. Ethiopia"
                />

                <Field
                  label="Region / State"
                  value={form.region}
                  onChange={(value) =>
                    updateField(
                      'region',
                      value,
                    )
                  }
                  placeholder="e.g. Somali Region"
                />

                <Field
                  label="City"
                  value={form.city}
                  onChange={(value) =>
                    updateField(
                      'city',
                      value,
                    )
                  }
                  placeholder="e.g. Jigjiga"
                />

                <Field
                  label="District / Area"
                  value={form.district}
                  onChange={(value) =>
                    updateField(
                      'district',
                      value,
                    )
                  }
                  placeholder="e.g. Kebele / District"
                />

                <div className="md:col-span-2">
                  <Field
                    label="Office Address"
                    value={form.officeAddress}
                    onChange={(value) =>
                      updateField(
                        'officeAddress',
                        value,
                      )
                    }
                    placeholder="Enter the business office address"
                    icon={
                      <MapPin size={17} />
                    }
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              ABOUT
          ================================================================ */}

          {activeSection === 'about' && (
            <SectionCard
              icon={<User size={21} />}
              title="About the Agent"
              description="Tell clients who you are, what you specialize in, and how you help them."
            >
              <div className="space-y-6">

                <TextAreaField
                  label="Professional Bio / Description"
                  value={form.bio}
                  onChange={(value) =>
                    updateField(
                      'bio',
                      value,
                    )
                  }
                  rows={7}
                  maxLength={1200}
                  placeholder="Tell clients about your experience, market knowledge, services and professional approach..."
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                  <Field
                    label="Years of Experience"
                    value={
                      form.yearsOfExperience
                    }
                    onChange={(value) =>
                      updateField(
                        'yearsOfExperience',
                        value,
                      )
                    }
                    placeholder="e.g. 5+ years"
                  />

                  <Field
                    label="Languages"
                    value={form.languages}
                    onChange={(value) =>
                      updateField(
                        'languages',
                        value,
                      )
                    }
                    placeholder="Somali, English, Amharic"
                    icon={
                      <Languages
                        size={17}
                      />
                    }
                  />

                  <div className="md:col-span-2">
                    <TagInputField
                      label="Specialties"
                      value={
                        form.specialties
                      }
                      onChange={(value) =>
                        updateField(
                          'specialties',
                          value,
                        )
                      }
                      placeholder="Residential, Land, Commercial, Rentals"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TagInputField
                      label="Services Offered"
                      value={
                        form.services
                      }
                      onChange={(value) =>
                        updateField(
                          'services',
                          value,
                        )
                      }
                      placeholder="Buy, Sell, Rent, Property Marketing, Property Management"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <TagInputField
                      label="Areas Served"
                      value={
                        form.serviceAreas
                      }
                      onChange={(value) =>
                        updateField(
                          'serviceAreas',
                          value,
                        )
                      }
                      placeholder="Jigjiga, Somali Region, surrounding areas"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              BUSINESS
          ================================================================ */}

          {activeSection === 'business' && (
            <SectionCard
              icon={
                <BriefcaseBusiness
                  size={21}
                />
              }
              title="Business Information"
              description="Set your availability, working hours and how quickly clients can expect a response."
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <SelectField
                  label="Typical Response Time"
                  value={
                    form.responseTime
                  }
                  onChange={(value) =>
                    updateField(
                      'responseTime',
                      value,
                    )
                  }
                  options={[
                    'Within 15 minutes',
                    'Within 1 hour',
                    'Within a few hours',
                    'Within 24 hours',
                    'Usually within 1–2 days',
                  ]}
                />

                <div />

                <ToggleField
                  label="Accepting New Clients"
                  description="Show that you are currently available for new client inquiries."
                  checked={
                    form.acceptingClients
                  }
                  onChange={(value) =>
                    updateField(
                      'acceptingClients',
                      value,
                    )
                  }
                />

                <ToggleField
                  label="Available for Property Tours"
                  description="Allow customers to know that you can arrange property visits."
                  checked={
                    form.availableForTours
                  }
                  onChange={(value) =>
                    updateField(
                      'availableForTours',
                      value,
                    )
                  }
                />
              </div>

              <div className="my-8 h-px bg-slate-100" />

              <div>
                <div className="mb-5 flex items-center gap-3">
                  <Clock3
                    size={19}
                    className="text-[#0065EB]"
                  />

                  <div>
                    <h3 className="font-black text-slate-950">
                      Business Hours
                    </h3>

                    <p className="text-xs font-medium text-slate-400">
                      Set the hours customers can expect your office to be available.
                    </p>
                  </div>
                </div>

                <BusinessHoursEditor
                  hours={
                    form.businessHours
                  }
                  onChange={
                    updateBusinessHour
                  }
                />
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              CREDENTIALS
          ================================================================ */}

          {activeSection === 'credentials' && (
            <SectionCard
              icon={<Award size={21} />}
              title="Professional Credentials"
              description="Optional professional information that can strengthen your public agent profile."
            >
              <div className="space-y-6">

                <Field
                  label="Real Estate License / Professional License"
                  value={
                    form.licenseNumber
                  }
                  onChange={(value) =>
                    updateField(
                      'licenseNumber',
                      value,
                    )
                  }
                  placeholder="Enter license number if applicable"
                  icon={
                    <ShieldCheck
                      size={17}
                    />
                  }
                />

                <Field
                  label="Business Registration Number"
                  value={
                    form.businessRegistrationNumber
                  }
                  onChange={(value) =>
                    updateField(
                      'businessRegistrationNumber',
                      value,
                    )
                  }
                  placeholder="Enter business registration number if applicable"
                  icon={
                    <BriefcaseBusiness
                      size={17}
                    />
                  }
                />

                <TagInputField
                  label="Certifications / Professional Qualifications"
                  value={
                    form.certifications
                  }
                  onChange={(value) =>
                    updateField(
                      'certifications',
                      value,
                    )
                  }
                  placeholder="Real Estate Certification, Property Management, etc."
                />

                {form.isVerified && (
                  <div className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <BadgeCheck
                      size={24}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                      <p className="font-black text-blue-950">
                        Verified Entity
                      </p>

                      <p className="mt-1 text-sm font-medium leading-6 text-blue-700">
                        Your verification status is managed by
                        GuriUp. This form does not allow agents to
                        manually grant themselves verification.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              SOCIAL
          ================================================================ */}

          {activeSection === 'social' && (
            <SectionCard
              icon={<Globe2 size={21} />}
              title="Social & Online Presence"
              description="Add your professional social profiles so customers can learn more about your agency."
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                <Field
                  label="Facebook"
                  value={form.facebook}
                  onChange={(value) =>
                    updateField(
                      'facebook',
                      value,
                    )
                  }
                  placeholder="https://facebook.com/..."
                  icon={
                    <Facebook
                      size={17}
                    />
                  }
                />

                <Field
                  label="Instagram"
                  value={form.instagram}
                  onChange={(value) =>
                    updateField(
                      'instagram',
                      value,
                    )
                  }
                  placeholder="https://instagram.com/..."
                  icon={
                    <Instagram
                      size={17}
                    />
                  }
                />

                <Field
                  label="TikTok"
                  value={form.tiktok}
                  onChange={(value) =>
                    updateField(
                      'tiktok',
                      value,
                    )
                  }
                  placeholder="https://tiktok.com/@..."
                  icon={
                    <Globe2 size={17} />
                  }
                />

                <Field
                  label="LinkedIn"
                  value={form.linkedin}
                  onChange={(value) =>
                    updateField(
                      'linkedin',
                      value,
                    )
                  }
                  placeholder="https://linkedin.com/in/..."
                  icon={
                    <Linkedin
                      size={17}
                    />
                  }
                />
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              VISIBILITY
          ================================================================ */}

          {activeSection === 'visibility' && (
            <SectionCard
              icon={<ShieldCheck size={21} />}
              title="Public Profile Visibility"
              description="Control which agent contact details are displayed publicly to GuriUp users."
            >
              <div className="space-y-3">

                <VisibilityToggle
                  icon={
                    <Phone size={18} />
                  }
                  title="Show Phone Number"
                  description="Allow customers to see your primary phone number."
                  checked={
                    form.showPhone
                  }
                  onChange={(value) =>
                    updateField(
                      'showPhone',
                      value,
                    )
                  }
                />

                <VisibilityToggle
                  icon={
                    <MessageCircle
                      size={18}
                    />
                  }
                  title="Show WhatsApp"
                  description="Display your WhatsApp contact option on your public profile."
                  checked={
                    form.showWhatsApp
                  }
                  onChange={(value) =>
                    updateField(
                      'showWhatsApp',
                      value,
                    )
                  }
                />

                <VisibilityToggle
                  icon={
                    <Mail size={18} />
                  }
                  title="Show Email"
                  description="Display your email address publicly."
                  checked={
                    form.showEmail
                  }
                  onChange={(value) =>
                    updateField(
                      'showEmail',
                      value,
                    )
                  }
                />

                <VisibilityToggle
                  icon={
                    <MapPin size={18} />
                  }
                  title="Show Office Address"
                  description="Display your agency office address publicly."
                  checked={
                    form.showAddress
                  }
                  onChange={(value) =>
                    updateField(
                      'showAddress',
                      value,
                    )
                  }
                />

                <VisibilityToggle
                  icon={
                    <Clock3 size={18} />
                  }
                  title="Show Business Hours"
                  description="Display your working hours on your public profile."
                  checked={
                    form.showBusinessHours
                  }
                  onChange={(value) =>
                    updateField(
                      'showBusinessHours',
                      value,
                    )
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-amber-600"
                  />

                  <div>
                    <p className="font-black text-amber-950">
                      Privacy reminder
                    </p>

                    <p className="mt-1 text-sm font-medium leading-6 text-amber-800">
                      Only enable public contact information that
                      you are comfortable displaying to people
                      browsing GuriUp.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* ================================================================
              BOTTOM ACTIONS
          ================================================================ */}

          <div className="sticky bottom-4 z-30 mt-8">

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">

              <div className="hidden pl-3 sm:block">
                <p className="text-xs font-black text-slate-900">
                  Keep your agent profile up to date
                </p>

                <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                  Customers use this information to understand your business.
                </p>
              </div>

              <div className="flex w-full gap-3 sm:w-auto">

                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0065EB] px-7 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#0052C1] disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />

                      Save Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================================
   SECTION CARD
============================================================================ */

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/70 px-5 py-6 md:px-8 md:py-7">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0065EB]">
            {icon}
          </div>

          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {title}
            </h2>

            <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8">
        {children}
      </div>
    </section>
  );
}

/* ============================================================================
   PHOTO UPLOAD
============================================================================ */

function PhotoUploadCard({
  label,
  description,
  imageUrl,
  uploading,
  accept,
  aspectClass,
  onFileSelected,
  onRemove,
}: {
  label: string;
  description: string;
  imageUrl: string;
  uploading: boolean;
  accept: string;
  aspectClass: string;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}) {
  const inputId = `agent-photo-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white">
      <div className="border-b border-slate-100 bg-slate-50/70 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black text-slate-950">
              {label}
            </p>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
              {description}
            </p>
          </div>

          <div className="rounded-xl bg-blue-50 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#0065EB]">
            Firebase
          </div>
        </div>
      </div>

      <div className="p-5">
        <div
          className={`relative ${aspectClass} overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50`}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                <User size={22} />
              </div>
              <p className="text-sm font-black text-slate-700">
                No {label.toLowerCase()} uploaded
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                JPG, PNG, WEBP or AVIF
              </p>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
              <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black text-slate-900 shadow-xl">
                <Loader2 size={16} className="animate-spin text-[#0065EB]" />
                Uploading...
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label
            htmlFor={inputId}
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#0065EB] px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#0052C1] ${
              uploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="mr-2 animate-spin" />
                Uploading
              </>
            ) : (
              <>
                <Store size={15} className="mr-2" />
                Upload Photo
              </>
            )}
          </label>

          <input
            id={inputId}
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                onFileSelected(file);
              }

              event.currentTarget.value = '';
            }}
          />

          {imageUrl && (
            <button
              type="button"
              onClick={onRemove}
              disabled={uploading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>

        <p className="mt-3 text-[10px] font-semibold leading-5 text-slate-400">
          {label === 'Profile Photo'
            ? 'Maximum 5MB. The uploaded Firebase URL is saved to your agent profile.'
            : 'Maximum 10MB. The uploaded Firebase URL is saved to your agent profile.'}
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
   FIELD
============================================================================ */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          required={required}
          className={`
            w-full rounded-2xl border border-slate-200
            bg-slate-50 px-4 py-4 text-sm font-bold
            text-slate-900 outline-none transition
            placeholder:text-slate-300
            hover:border-slate-300
            focus:border-[#0065EB]
            focus:bg-white
            focus:ring-4
            focus:ring-blue-500/10
            ${icon ? 'pl-11' : ''}
          `}
        />
      </div>
    </div>
  );
}

/* ============================================================================
   TEXT AREA
============================================================================ */

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
          {label}
        </label>

        {maxLength && (
          <span className="text-[10px] font-bold text-slate-300">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-bold leading-6 text-slate-900 outline-none transition placeholder:text-slate-300 hover:border-slate-300 focus:border-[#0065EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
      />
    </div>
  );
}

/* ============================================================================
   SELECT
============================================================================ */

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </label>

      <div className="relative">
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 pr-11 text-sm font-bold text-slate-900 outline-none transition hover:border-slate-300 focus:border-[#0065EB] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        >
          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </div>
  );
}

/* ============================================================================
   TAG INPUT
============================================================================ */

function TagInputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const tags = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div>
      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
        {label}
      </label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition focus-within:border-[#0065EB] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">

        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-black text-blue-700"
              >
                {tag}

                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      tags
                        .filter(
                          (item) =>
                            item !== tag,
                        )
                        .join(', '),
                    )
                  }
                  className="rounded-full p-0.5 hover:bg-blue-100"
                  aria-label={`Remove ${tag}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="w-full bg-transparent px-1 py-2 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
        />
      </div>

      <p className="mt-2 text-[10px] font-semibold text-slate-400">
        Separate multiple items with commas.
      </p>
    </div>
  );
}

/* ============================================================================
   TOGGLE
============================================================================ */

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="font-black text-slate-950">
            {label}
          </p>

          <p className="mt-1 max-w-md text-xs font-medium leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() =>
            onChange(!checked)
          }
          className={`
            relative h-7 w-12 shrink-0 rounded-full
            transition-all
            ${
              checked
                ? 'bg-[#0065EB]'
                : 'bg-slate-300'
            }
          `}
        >
          <span
            className={`
              absolute top-1 h-5 w-5 rounded-full
              bg-white shadow-sm transition-all
              ${
                checked
                  ? 'left-6'
                  : 'left-1'
              }
            `}
          />
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   VISIBILITY
============================================================================ */

function VisibilityToggle({
  icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-200">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black text-slate-950">
          {title}
        </p>

        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() =>
          onChange(!checked)
        }
        className={`
          relative h-7 w-12 shrink-0 rounded-full
          transition-all
          ${
            checked
              ? 'bg-[#0065EB]'
              : 'bg-slate-300'
          }
        `}
      >
        <span
          className={`
            absolute top-1 h-5 w-5 rounded-full
            bg-white shadow-sm transition-all
            ${
              checked
                ? 'left-6'
                : 'left-1'
            }
          `}
        />
      </button>
    </div>
  );
}

/* ============================================================================
   BUSINESS HOURS
============================================================================ */

function BusinessHoursEditor({
  hours,
  onChange,
}: {
  hours: AgentBusinessHours;
  onChange: (
    day: keyof AgentBusinessHours,
    field: keyof BusinessHoursDay,
    value: string | boolean,
  ) => void;
}) {
  const days: Array<{
    key: keyof AgentBusinessHours;
    label: string;
  }> = [
    {
      key: 'monday',
      label: 'Monday',
    },
    {
      key: 'tuesday',
      label: 'Tuesday',
    },
    {
      key: 'wednesday',
      label: 'Wednesday',
    },
    {
      key: 'thursday',
      label: 'Thursday',
    },
    {
      key: 'friday',
      label: 'Friday',
    },
    {
      key: 'saturday',
      label: 'Saturday',
    },
    {
      key: 'sunday',
      label: 'Sunday',
    },
  ];

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const current =
          hours[day.key];

        return (
          <div
            key={day.key}
            className={`
              grid grid-cols-1 gap-3 rounded-2xl
              border p-4 md:grid-cols-[180px_1fr_1fr]
              md:items-center
              ${
                current.enabled
                  ? 'border-slate-200 bg-white'
                  : 'border-slate-100 bg-slate-50'
              }
            `}
          >
            <div className="flex items-center justify-between md:justify-start md:gap-4">
              <span className="text-sm font-black text-slate-900">
                {day.label}
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={
                  current.enabled
                }
                onClick={() =>
                  onChange(
                    day.key,
                    'enabled',
                    !current.enabled,
                  )
                }
                className={`
                  relative h-6 w-11 rounded-full
                  transition
                  ${
                    current.enabled
                      ? 'bg-[#0065EB]'
                      : 'bg-slate-300'
                  }
                `}
              >
                <span
                  className={`
                    absolute top-1 h-4 w-4
                    rounded-full bg-white
                    shadow-sm transition
                    ${
                      current.enabled
                        ? 'left-6'
                        : 'left-1'
                    }
                  `}
                />
              </button>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                Opens
              </span>

              <input
                type="time"
                value={current.open}
                disabled={!current.enabled}
                onChange={(event) =>
                  onChange(
                    day.key,
                    'open',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0065EB] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[9px] font-black uppercase tracking-widest text-slate-400">
                Closes
              </span>

              <input
                type="time"
                value={current.close}
                disabled={!current.enabled}
                onChange={(event) =>
                  onChange(
                    day.key,
                    'close',
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900 outline-none focus:border-[#0065EB] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </label>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
   SETTINGS ICON
============================================================================ */

function SettingsIcon() {
  return (
    <Sparkles size={15} />
  );
}
