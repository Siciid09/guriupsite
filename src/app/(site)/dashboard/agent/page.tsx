'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  orderBy, 
  getDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, storage } from '../../../lib/firebase';
import { 
  LayoutDashboard, 
  Plus, 
  Search, 
  Bell, 
  LogOut, 
  Home, 
  Loader2, 
  Eye, 
  MessageSquare, 
  MapPin, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Save, 
  X, 
  Image as ImageIcon, 
  Lock, 
  Type, 
  DollarSign, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

// --- TYPES ---
type ViewMode = 'dashboard' | 'editor';
type EditorMode = 'add' | 'edit';
type PlanTier = 'free' | 'pro' | 'premium' | 'agent_pro';

export default function AgentAllInOnePage() {
  const router = useRouter();

  // --- GLOBAL STATE ---
  const [user, setUser] = useState<any>(null);
  const [planTier, setPlanTier] = useState<PlanTier>('free');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('dashboard');

  // --- DASHBOARD STATE ---
  const [properties, setProperties] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalListings: 0, totalViews: 0, totalLeads: 0, activeListings: 0 });
  
  // --- EDITOR STATE ---
  const [editorMode, setEditorMode] = useState<EditorMode>('add');
  const [targetPropId, setTargetPropId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);

  // Pro Check
  const isPro = ['pro', 'premium', 'agent_pro'].includes(planTier);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // 1. Fetch User Plan
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setPlanTier(userDoc.data().planTier || 'free');
        }
        // 2. Fetch Dashboard Data
        await fetchProperties(currentUser.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // --- FETCH PROPERTIES ---
  const fetchProperties = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'property'),
        where('agentId', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const props: any[] = [];
      let views = 0;
      let active = 0;

      snapshot.forEach((doc) => {
        const d = doc.data();
        props.push({ id: doc.id, ...d });
        views += (d.views || 0);
        if (d.status === 'available') active++;
      });

      setProperties(props);
      setStats({
        totalListings: props.length,
        totalViews: views,
        totalLeads: 0, // Placeholder
        activeListings: active
      });
    } catch (err) {
      console.error("Error fetching properties:", err);
    }
  };

  // --- ACTIONS: NAVIGATION ---
  const openDashboard = () => {
    setView('dashboard');
    setTargetPropId(null);
    setNewImages([]);
    setExistingImages([]);
    setFormData({});
    if (user) fetchProperties(user.uid); // Refresh list
  };

  const openAddEditor = () => {
    setEditorMode('add');
    setTargetPropId(null);
    initializeForm(null);
    setView('editor');
  };

  const openEditEditor = (prop: any) => {
    setEditorMode('edit');
    setTargetPropId(prop.id);
    initializeForm(prop);
    setView('editor');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // --- ACTIONS: DELETE ---
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This action cannot be undone.")) {
      try {
        await deleteDoc(doc(db, 'property', id));
        setProperties(prev => prev.filter(p => p.id !== id));
        setStats(prev => ({ ...prev, totalListings: prev.totalListings - 1 }));
      } catch (err) {
        alert("Failed to delete property.");
      }
    }
  };

  // --- EDITOR LOGIC: INITIALIZE FORM ---
  const initializeForm = (data: any | null) => {
    if (data) {
      // Load Existing
      const f = data.features || {};
      setFormData({
        title: data.title || '',
        price: data.price || '',
        description: data.description || '',
        type: data.type || 'House',
        status: data.status || 'available',
        isForSale: data.isForSale || false,
        city: data.location?.city || '',
        area: data.location?.area || '',
        gpsCoordinates: data.location?.gpsCoordinates || '',
        
        size: f.size || '',
        bedrooms: f.bedrooms || '',
        bathrooms: f.bathrooms || '',
        floorLevel: f.floorLevel || '',
        workspaceArea: f.workspaceArea || '',
        floorCount: f.floorCount || '',
        shopCount: f.shopCount || '',
        seatingCapacity: f.seatingCapacity || '',
        roadAccess: f.roadAccess || 'Paved',
        features: f 
      });
      setExistingImages(data.images || []);
    } else {
      // Reset New
      setFormData({
        title: '', price: '', description: '', type: 'House', status: 'available', isForSale: false,
        city: '', area: '', gpsCoordinates: '',
        size: '', bedrooms: '', bathrooms: '', floorLevel: '', workspaceArea: '',
        floorCount: '', shopCount: '', seatingCapacity: '', roadAccess: 'Paved',
        features: {}
      });
      setExistingImages([]);
    }
    setNewImages([]);
  };

  // --- EDITOR LOGIC: SUBMIT ---
  const handleEditorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Validation
      if (!formData.title || !formData.price || !formData.city) throw new Error("Title, Price and City are required.");
      if (!isPro && formData.description.length > 100) throw new Error("Free plan description limit: 100 chars.");
      if (!isPro && (existingImages.length + newImages.length) > 1) throw new Error("Free plan image limit: 1 max.");

      // 1. Upload Images
      const uploadedUrls: string[] = [];
      for (const file of newImages) {
        const storageRef = ref(storage, `property_images/img_${Date.now()}_${file.name}`);
        const snap = await uploadBytes(storageRef, file);
        uploadedUrls.push(await getDownloadURL(snap.ref));
      }
      const finalImages = [...existingImages, ...uploadedUrls];

      // 2. Build Payload
      const f = formData.features || {};
      const featuresMap = {
        size: Number(formData.size) || 0,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        floorLevel: Number(formData.floorLevel) || 0,
        workspaceArea: Number(formData.workspaceArea) || 0,
        floorCount: Number(formData.floorCount) || 0,
        shopCount: Number(formData.shopCount) || 0,
        seatingCapacity: Number(formData.seatingCapacity) || 0,
        roadAccess: formData.roadAccess || "Paved",

        // Force booleans
        isFurnished: !!f.isFurnished, hasBalcony: !!f.hasBalcony, hasGarden: !!f.hasGarden,
        hasPool: !!f.hasPool, isSingleFloor: !!f.isSingleFloor, hasPorch: !!f.hasPorch,
        hasKitchenette: !!f.hasKitchenette, hasGate: !!f.hasGate, waterAvailable: !!f.waterAvailable,
        hasParking: !!f.hasParking, kitchenIncluded: !!f.kitchenIncluded, openPlan: !!f.openPlan,
        hasLaundry: !!f.hasLaundry, hasMeetingRoom: !!f.hasMeetingRoom, hasInternet: !!f.hasInternet,
        hasFence: !!f.hasFence, hasShopfront: !!f.hasShopfront, hasStorage: !!f.hasStorage,
        hasRestroom: !!f.hasRestroom, hasAirConditioning: !!f.hasAirConditioning,
        hasFoodCourt: !!f.hasFoodCourt, hasSecurity: !!f.hasSecurity, hasElevators: !!f.hasElevators,
        hasStage: !!f.hasStage
      };

      const payload = {
        title: formData.title,
        type: formData.type,
        status: formData.status,
        isForSale: String(formData.isForSale) === 'true',
        description: formData.description,
        price: Number(formData.price),
        agentVerified: isPro,
        planTierAtUpload: planTier,
        agentId: user.uid,
        agentName: user.displayName || 'Agent',
        images: finalImages,
        searchKeywords: isPro ? formData.title.toLowerCase().split(' ') : [],
        
        // App Defaults
        featured: false, isArchived: false, hasDiscount: false, discountPrice: 0, videoUrl: null,
        
        location: {
          city: formData.city,
          area: formData.area,
          gpsCoordinates: isPro ? formData.gpsCoordinates : '',
          lat: null, lng: null
        },
        features: featuresMap,
        updatedAt: serverTimestamp()
      };

      if (editorMode === 'add') {
        await addDoc(collection(db, 'property'), { ...payload, createdAt: serverTimestamp(), views: 0 });
      } else if (targetPropId) {
        await updateDoc(doc(db, 'property', targetPropId), payload);
      }

      openDashboard(); // Return to dashboard
    } catch (err: any) {
      alert(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // --- EDITOR HELPERS ---
  const handleTextChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFeatureToggle = (key: string) => {
    if (!isPro) return alert("Upgrade to Pro to use this feature!");
    setFormData((prev: any) => ({ ...prev, features: { ...prev.features, [key]: !prev.features[key] } }));
  };
  const handleImageSelect = (e: any) => {
    if (e.target.files) setNewImages(prev => [...prev, ...Array.from(e.target.files as FileList)]);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex">
      
      {/* === SIDEBAR === */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 font-black text-xl">
             <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Home size={20} /></div>
             <span>GuriUp<span className="text-slate-900">Agent</span></span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={view === 'dashboard'} onClick={openDashboard} />
          <SidebarItem icon={Plus} label="Add Property" active={view === 'editor' && editorMode === 'add'} onClick={openAddEditor} />
          <SidebarItem icon={TrendingUp} label="Analytics" />
        </nav>
        <div className="p-4 border-t border-slate-100">
           <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 font-medium text-sm">
             <LogOut size={18} /> Sign Out
           </button>
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 md:ml-64 p-6 relative">
        
        {/* --- VIEW 1: DASHBOARD --- */}
        {view === 'dashboard' && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
                <p className="text-slate-500 text-sm">Welcome back, {user?.displayName}</p>
              </div>
              <button onClick={openAddEditor} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 shadow-lg shadow-slate-900/20">
                 <Plus size={18} /> Add Listing
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
               <StatCard label="Total Listings" value={stats.totalListings} icon={Home} color="blue" />
               <StatCard label="Total Views" value={stats.totalViews} icon={Eye} color="indigo" />
               <StatCard label="Active Leads" value={stats.totalLeads} icon={MessageSquare} color="orange" />
               <StatCard label="Active" value={stats.activeListings} icon={TrendingUp} color="emerald" />
            </div>

            {/* Grid */}
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Properties</h2>
            {properties.length === 0 ? (
               <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300">
                  <p className="text-slate-400 font-medium">No properties found.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {properties.map(p => (
                  <PropertyCard key={p.id} data={p} onEdit={() => openEditEditor(p)} onDelete={() => handleDelete(p.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- VIEW 2: EDITOR (ADD/EDIT) --- */}
        {view === 'editor' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            {/* Editor Header */}
            <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm sticky top-4 z-30">
               <div className="flex items-center gap-4">
                 <button onClick={openDashboard} className="p-2 hover:bg-slate-50 rounded-full text-slate-500"><ArrowLeft size={20}/></button>
                 <h1 className="text-xl font-bold text-slate-900">{editorMode === 'add' ? 'Add New Listing' : 'Edit Property'}</h1>
               </div>
               <button 
                  onClick={handleEditorSubmit} 
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-70 transition-all shadow-lg shadow-blue-600/20"
               >
                 {saving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                 {editorMode === 'add' ? 'Publish' : 'Save Changes'}
               </button>
            </div>

            {/* Form */}
            <form className="space-y-6 pb-20">
              
              <Section title="Basic Info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Input label="Title" name="title" value={formData.title} onChange={handleTextChange} placeholder="e.g. Modern Villa" icon={Type} />
                   <div className="grid grid-cols-2 gap-4">
                      <Select label="Type" name="type" value={formData.type} onChange={handleTextChange} options={['House', 'Apartment', 'Villa', 'Studio', 'Office', 'Business', 'Land', 'Hall']} />
                      <Select label="Action" name="isForSale" value={formData.isForSale.toString()} onChange={handleTextChange} options={[{val:'false', txt:'Rent'}, {val:'true', txt:'Sale'}]} />
                   </div>
                   <Input label="Price ($)" name="price" type="number" value={formData.price} onChange={handleTextChange} icon={DollarSign} />
                   <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description {!isPro && <span className="text-red-500 lowercase ml-1">(Max 100 chars)</span>}</label>
                      <textarea name="description" rows={4} value={formData.description} onChange={handleTextChange} className={`w-full p-4 bg-slate-50 border rounded-xl text-sm font-medium outline-none focus:border-blue-500 ${!isPro && formData.description?.length > 100 ? 'border-red-500' : 'border-slate-200'}`}></textarea>
                   </div>
                </div>
              </Section>

              <Section title="Media">
                 <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    <label className={`aspect-square bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors ${!isPro && (existingImages.length + newImages.length) >= 1 ? 'opacity-50 pointer-events-none' : ''}`}>
                       <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageSelect} />
                       <ImageIcon className="text-slate-400 mb-1" />
                       <span className="text-[10px] font-bold text-slate-500">Add Photo</span>
                    </label>
                    {existingImages.map(url => (
                       <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
                          <Image src={url} alt="img" fill className="object-cover" />
                          <button type="button" onClick={() => setExistingImages(prev => prev.filter(i => i !== url))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={10} /></button>
                       </div>
                    ))}
                    {newImages.map((file, i) => (
                       <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-blue-200">
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"><X size={10} /></button>
                       </div>
                    ))}
                 </div>
                 {!isPro && <p className="text-xs text-orange-600 font-bold mt-2 flex items-center gap-1"><Lock size={12}/> Free Plan Limit: 1 Image</p>}
              </Section>

              <Section title="Location">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="City" name="city" value={formData.city} onChange={handleTextChange} icon={MapPin} />
                    <Input label="Area" name="area" value={formData.area} onChange={handleTextChange} icon={MapPin} />
                    <Input label="GPS (Pro Only)" name="gpsCoordinates" value={formData.gpsCoordinates} onChange={handleTextChange} disabled={!isPro} icon={isPro ? MapPin : Lock} placeholder={!isPro ? "Locked" : ""} />
                 </div>
              </Section>

              <Section title="Details & Features">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <Input label="Size (m²)" name="size" type="number" value={formData.size} onChange={handleTextChange} />
                    {['House','Apartment','Villa','Studio'].includes(formData.type) && (
                      <>
                        <Input label="Bedrooms" name="bedrooms" type="number" value={formData.bedrooms} onChange={handleTextChange} />
                        <Input label="Bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleTextChange} />
                      </>
                    )}
                 </div>
                 
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Amenities { !isPro && <span className="text-red-500">(Locked)</span> }</label>
                 <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${!isPro ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Checkbox label="Furnished" checked={formData.features?.isFurnished} onChange={() => handleFeatureToggle('isFurnished')} />
                    <Checkbox label="Balcony" checked={formData.features?.hasBalcony} onChange={() => handleFeatureToggle('hasBalcony')} />
                    <Checkbox label="Parking" checked={formData.features?.hasParking} onChange={() => handleFeatureToggle('hasParking')} />
                    <Checkbox label="Garden" checked={formData.features?.hasGarden} onChange={() => handleFeatureToggle('hasGarden')} />
                    <Checkbox label="Water Tank" checked={formData.features?.waterAvailable} onChange={() => handleFeatureToggle('waterAvailable')} />
                    <Checkbox label="Security" checked={formData.features?.hasGate} onChange={() => handleFeatureToggle('hasGate')} />
                 </div>
              </Section>

            </form>
          </div>
        )}

      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
    <Icon size={20} className={active ? 'text-blue-600' : 'text-slate-400'} /> {label}
  </button>
);

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const c = { blue: "bg-blue-50 text-blue-600", indigo: "bg-indigo-50 text-indigo-600", orange: "bg-orange-50 text-orange-600", emerald: "bg-emerald-50 text-emerald-600" }[color as string];
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c}`}><Icon size={24} /></div>
      <div><p className="text-slate-400 text-xs font-bold uppercase">{label}</p><p className="text-2xl font-black text-slate-900">{value}</p></div>
    </div>
  );
};

const PropertyCard = ({ data, onEdit, onDelete }: any) => (
  <div className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
    <div className="relative h-48 bg-slate-100">
      {data.images?.[0] ? <img src={data.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Home size={32}/></div>}
      <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/50 backdrop-blur text-white text-xs font-bold">{data.status}</div>
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
         <button onClick={onEdit} className="p-2 bg-white rounded-full hover:scale-110 transition-transform"><Edit3 size={16}/></button>
         <button onClick={onDelete} className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform"><Trash2 size={16}/></button>
      </div>
    </div>
    <div className="p-4">
       <h3 className="font-bold text-slate-900 truncate">{data.title}</h3>
       <p className="text-blue-600 font-black text-sm">${data.price}</p>
       <div className="flex items-center text-slate-400 text-xs mt-2"><MapPin size={12} className="mr-1"/> {data.location?.city}</div>
    </div>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
    <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-50 pb-2">{title}</h3>
    {children}
  </div>
);

const Input = ({ label, name, value, onChange, placeholder, type="text", icon: Icon, disabled }: any) => (
  <div className={disabled ? 'opacity-50' : ''}>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
    <div className="relative">
      {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon size={16}/></div>}
      <input type={type} name={name} value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} className={`w-full ${Icon?'pl-10':'pl-4'} pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500 transition-all`} />
    </div>
  </div>
);

const Select = ({ label, name, value, onChange, options }: any) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
    <select name={name} value={value} onChange={onChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500">
      {options.map((o: any) => (
         typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.val} value={o.val}>{o.txt}</option>
      ))}
    </select>
  </div>
);

const Checkbox = ({ label, checked, onChange }: any) => (
  <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 border border-transparent hover:border-slate-200">
    <div className={`w-5 h-5 rounded flex items-center justify-center ${checked ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}><CheckCircle size={14}/></div>
    <span className="text-sm font-bold text-slate-700">{label}</span>
  </label>
);