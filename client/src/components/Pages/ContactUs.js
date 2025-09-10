import React, { useState, useEffect } from 'react';
import { 
  FaEnvelope, 
  FaGithub, 
  FaLinkedin, 
  FaTwitter, 
  FaPaperPlane, 
  FaMapMarkerAlt, 
  FaPhone,
  FaSpinner,
  FaCheckCircle,
  FaUser,
  FaShare,
  FaCommentDots
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    AOS.init({
      once: false,
      duration: 1000,
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // **UPDATED**: Handle form submission to Google Forms
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Google Form submission URL - replace with your actual form URL
      const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScguKSV6VYujicsU_YTM07dPGobHtWbZidSQizuRF6Ok989uw/formResponse';
      
      // Create form data for Google Forms
      const googleFormData = new FormData();
      
      // **IMPORTANT**: Replace these entry IDs with your actual Google Form field IDs
      // To get the correct entry IDs:
      // 1. Go to your Google Form
      // 2. Click "Preview" 
      // 3. Right-click and "View Page Source"
      // 4. Search for "entry." to find the field IDs
      
      googleFormData.append('entry.623631445', formData.name);     // Replace XXXXXXXX with actual entry ID for name
      googleFormData.append('entry.773860979', formData.email);    // Replace YYYYYYYY with actual entry ID for email  
      googleFormData.append('entry.276134281', formData.subject);  // Replace ZZZZZZZZ with actual entry ID for subject
      googleFormData.append('entry.505656504', formData.message);  // Replace AAAAAAAA with actual entry ID for message

      // Submit to Google Forms
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Forms
        body: googleFormData
      });

      // Show success message
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      setTimeout(() => setSubmitted(false), 5000);
      
    } catch (error) {
      console.error('Form submission error:', error);
      // Still show success message since no-cors mode doesn't return response
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitted(false), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FaEnvelope,
      title: 'Email',
      value: 'contact@alphaknowledge.com',
      link: 'mailto:contact@alphaknowledge.com'
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Location',
      value: 'Remote Team, Worldwide',
      link: null
    },
    {
      icon: FaPhone,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567'
    }
  ];

  const socialLinks = [
    {
      icon: FaGithub,
      name: 'GitHub',
      url: 'https://github.com/alphaknowledge'
    },
    {
      icon: FaLinkedin,
      name: 'LinkedIn',
      url: 'https://linkedin.com/company/alphaknowledge'
    },
    {
      icon: FaTwitter,
      name: 'Twitter',
      url: 'https://twitter.com/alphaknowledge'
    }
  ];

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
    
    {/* Background Effects - Only visible in dark mode */}
    <div className="absolute inset-0 overflow-hidden dark:block hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#a855f7]/20 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
    </div>

    <div className="max-w-4xl mx-auto relative z-10">
      {/* Header Section */}
      <div className="text-center mb-16">
        <h2
          data-aos="fade-down"
          data-aos-duration="1000"
          className="inline-block text-4xl sm:text-5xl lg:text-6xl font-bold text-center mx-auto mb-6 tracking-tight"
          style={{
            backgroundImage: "linear-gradient(45deg, #6366f1 10%, #a855f7 93%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Get in Touch
        </h2>
        <p
          data-aos="fade-up"
          data-aos-duration="1100"
          className="text-gray-600 dark:text-slate-400 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed"
        >
          Have questions, suggestions, or need help? We'd love to hear from you and help you on your coding journey!
        </p>
      </div>

      {/* Contact Form - Now Full Width */}
      <div 
        className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200/50 dark:border-white/10 transform transition-all duration-500 hover:shadow-xl dark:hover:shadow-[#6366f1]/10"
        data-aos="fade-up"
        data-aos-duration="1000"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
              Send us a Message
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Got questions about DSA? Need guidance on your learning path? Drop us a message!
            </p>
          </div>
          <FaPaperPlane className="w-8 h-8 text-[#6366f1] opacity-50" />
        </div>
        
        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-500/20 dark:to-emerald-500/20 border border-green-300 dark:border-green-500/30 rounded-2xl animate-in slide-in-from-top duration-300">
            <div className="flex items-center space-x-3">
              <FaCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 animate-bounce" />
              <p className="text-green-700 dark:text-green-300 font-semibold">
                Thank you! Your message has been sent successfully.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Name and Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative group">
              <FaUser className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50"
                placeholder="Your full name"
              />
            </div>
            <div className="relative group">
              <FaEnvelope className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="relative group">
            <FaCommentDots className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50"
              placeholder="What is this about?"
            />
          </div>

          {/* Message */}
          <div className="relative group">
            <FaCommentDots className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              rows="6"
              className="w-full resize-none p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50"
              placeholder="Tell us more about your question or feedback..."
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5855eb] hover:to-[#9333ea] text-white py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#6366f1]/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <FaPaperPlane className="w-5 h-5" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </form>

        {/* Social Links - Moved below the form */}
        <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/10">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
            <FaCommentDots className="w-5 h-5 text-[#6366f1]" />
            Follow Us
          </h3>
          <div className="flex justify-center space-x-8">
            {socialLinks.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                >
                  <div className="absolute -inset-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full blur opacity-30 group-hover:opacity-75 transition duration-300" />
                  <div className="relative p-4 bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-full border border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 transform hover:scale-110">
                    <Icon className="w-6 h-6" />
                  </div>
                </a>
              );
            })}
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-sm">
            Connect with us on social media for the latest updates and DSA tips!
          </p>
        </div>
      </div>
    </div>
  </div>
);

};

export default ContactUs;


// import React, { useState, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import { 
//   FaEnvelope, 
//   FaGithub, 
//   FaLinkedin, 
//   FaTwitter, 
//   FaPaperPlane, 
//   FaMapMarkerAlt, 
//   FaPhone,
//   FaSpinner,
//   FaCheckCircle,
//   FaUser,
//   FaShare,
//   FaCommentDots
// } from 'react-icons/fa';
// import AOS from 'aos';
// import 'aos/dist/aos.css';

// const ContactUs = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     subject: '',
//     message: ''
//   });
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   useEffect(() => {
//     AOS.init({
//       once: false,
//       duration: 1000,
//     });
//   }, []);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   // **UPDATED**: Handle form submission with proper toast notifications
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Form validation
//     if (!formData.name.trim()) {
//       toast.error('Please enter your name');
//       return;
//     }
//     if (!formData.email.trim()) {
//       toast.error('Please enter your email');
//       return;
//     }
//     if (!formData.subject.trim()) {
//       toast.error('Please enter a subject');
//       return;
//     }
//     if (!formData.message.trim()) {
//       toast.error('Please enter your message');
//       return;
//     }

//     setIsSubmitting(true);
    
//     try {
//       // Show loading toast
//       const loadingToast = toast.loading('Sending your message...', {
//         duration: Infinity,
//       });

//       // Google Form submission URL - replace with your actual form URL
//       const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScguKSV6VYujicsU_YTM07dPGobHtWbZidSQizuRF6Ok989uw/formResponse';
      
//       // Create form data for Google Forms
//       const googleFormData = new FormData();
      
//       // **IMPORTANT**: Replace these entry IDs with your actual Google Form field IDs
//       googleFormData.append('entry.623631445', formData.name);     // Replace with actual entry ID for name
//       googleFormData.append('entry.773860979', formData.email);    // Replace with actual entry ID for email  
//       googleFormData.append('entry.276134281', formData.subject);  // Replace with actual entry ID for subject
//       googleFormData.append('entry.505656504', formData.message);  // Replace with actual entry ID for message

//       // Submit to Google Forms with timeout
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

//       await fetch(GOOGLE_FORM_URL, {
//         method: 'POST',
//         mode: 'no-cors', // Required for Google Forms
//         body: googleFormData,
//         signal: controller.signal
//       });

//       clearTimeout(timeoutId);

//       // Dismiss loading toast
//       toast.dismiss(loadingToast);

//       // Show success message
//       toast.success('Message sent successfully! We\'ll get back to you soon.', {
//         duration: 5000,
//         icon: '🎉',
//       });
      
//       // Reset form
//       setFormData({ name: '', email: '', subject: '', message: '' });
      
//     } catch (error) {
//       console.error('Form submission error:', error);
      
//       // Dismiss any existing toasts
//       toast.dismiss();
      
//       if (error.name === 'AbortError') {
//         toast.error('Request timed out. Please try again.');
//       } else {
//         // For no-cors mode, we can't detect actual errors, so show success
//         toast.success('Message sent successfully! We\'ll get back to you soon.', {
//           duration: 5000,
//           icon: '🎉',
//         });
        
//         // Reset form on assumed success
//         setFormData({ name: '', email: '', subject: '', message: '' });
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const contactInfo = [
//     {
//       icon: FaEnvelope,
//       title: 'Email',
//       value: 'contact@alphaknowledge.com',
//       link: 'mailto:contact@alphaknowledge.com'
//     },
//     {
//       icon: FaMapMarkerAlt,
//       title: 'Location',
//       value: 'Remote Team, Worldwide',
//       link: null
//     },
//     {
//       icon: FaPhone,
//       title: 'Phone',
//       value: '+1 (555) 123-4567',
//       link: 'tel:+15551234567'
//     }
//   ];

//   const socialLinks = [
//     {
//       icon: FaGithub,
//       name: 'GitHub',
//       url: 'https://github.com/alphaknowledge'
//     },
//     {
//       icon: FaLinkedin,
//       name: 'LinkedIn',
//       url: 'https://linkedin.com/company/alphaknowledge'
//     },
//     {
//       icon: FaTwitter,
//       name: 'Twitter',
//       url: 'https://twitter.com/alphaknowledge'
//     }
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-[#030014] dark:via-slate-900 dark:to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      
//       {/* Background Effects - Only visible in dark mode */}
//       <div className="absolute inset-0 overflow-hidden dark:block hidden">
//         <div className="absolute top-10 left-10 w-72 h-72 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" />
//         <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#a855f7]/20 rounded-full blur-3xl animate-pulse delay-1000" />
//         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
//       </div>

//       <div className="max-w-4xl mx-auto relative z-10">
//         {/* Header Section */}
//         <div className="text-center mb-16">
//           <h2
//             data-aos="fade-down"
//             data-aos-duration="1000"
//             className="inline-block text-4xl sm:text-5xl lg:text-6xl font-bold text-center mx-auto mb-6 tracking-tight"
//             style={{
//               backgroundImage: "linear-gradient(45deg, #6366f1 10%, #a855f7 93%)",
//               WebkitBackgroundClip: "text",
//               backgroundClip: "text",
//               WebkitTextFillColor: "transparent",
//             }}
//           >
//             Get in Touch
//           </h2>
//           <p
//             data-aos="fade-up"
//             data-aos-duration="1100"
//             className="text-gray-600 dark:text-slate-400 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed"
//           >
//             Have questions, suggestions, or need help? We'd love to hear from you and help you on your coding journey!
//           </p>
//         </div>

//         {/* Contact Form - Now Full Width */}
//         <div 
//           className="bg-white/90 dark:bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-200/50 dark:border-white/10 transform transition-all duration-500 hover:shadow-xl dark:hover:shadow-[#6366f1]/10"
//           data-aos="fade-up"
//           data-aos-duration="1000"
//         >
//           <div className="flex justify-between items-start mb-8">
//             <div>
//               <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
//                 Send us a Message
//               </h2>
//               <p className="text-gray-600 dark:text-gray-400">
//                 Got questions about DSA? Need guidance on your learning path? Drop us a message!
//               </p>
//             </div>
//             <FaPaperPlane className="w-8 h-8 text-[#6366f1] opacity-50" />
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-6">
            
//             {/* Name and Email Row */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//               <div className="relative group">
//                 <FaUser className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
//                 <input
//                   type="text"
//                   id="name"
//                   name="name"
//                   value={formData.name}
//                   onChange={handleChange}
//                   required
//                   disabled={isSubmitting}
//                   className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="Your full name"
//                 />
//               </div>
//               <div className="relative group">
//                 <FaEnvelope className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
//                 <input
//                   type="email"
//                   id="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   required
//                   disabled={isSubmitting}
//                   className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50 disabled:cursor-not-allowed"
//                   placeholder="your.email@example.com"
//                 />
//               </div>
//             </div>

//             {/* Subject */}
//             <div className="relative group">
//               <FaCommentDots className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
//               <input
//                 type="text"
//                 id="subject"
//                 name="subject"
//                 value={formData.subject}
//                 onChange={handleChange}
//                 required
//                 disabled={isSubmitting}
//                 className="w-full p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50 disabled:cursor-not-allowed"
//                 placeholder="What is this about?"
//               />
//             </div>

//             {/* Message */}
//             <div className="relative group">
//               <FaCommentDots className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-[#6366f1] transition-colors" />
//               <textarea
//                 id="message"
//                 name="message"
//                 value={formData.message}
//                 onChange={handleChange}
//                 required
//                 disabled={isSubmitting}
//                 rows="6"
//                 className="w-full resize-none p-4 pl-12 bg-gray-50 dark:bg-white/10 rounded-xl border border-gray-300 dark:border-white/20 placeholder-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]/50 focus:border-transparent transition-all duration-300 hover:border-[#6366f1]/50 disabled:opacity-50 disabled:cursor-not-allowed"
//                 placeholder="Tell us more about your question or feedback..."
//               />
//             </div>

//             {/* Submit Button */}
//             <button 
//               type="submit" 
//               disabled={isSubmitting}
//               className="w-full bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5855eb] hover:to-[#9333ea] text-white py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#6366f1]/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
//             >
//               {isSubmitting ? (
//                 <>
//                   <FaSpinner className="w-5 h-5 animate-spin" />
//                   <span>Sending...</span>
//                 </>
//               ) : (
//                 <>
//                   <FaPaperPlane className="w-5 h-5" />
//                   <span>Send Message</span>
//                 </>
//               )}
//             </button>
//           </form>

//           {/* Social Links - Moved below the form */}
//           <div className="mt-10 pt-8 border-t border-gray-200 dark:border-white/10">
//             <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center gap-2">
//               <FaCommentDots className="w-5 h-5 text-[#6366f1]" />
//               Follow Us
//             </h3>
//             <div className="flex justify-center space-x-8">
//               {socialLinks.map((social, index) => {
//                 const Icon = social.icon;
//                 return (
//                   <a
//                     key={index}
//                     href={social.url}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="group relative"
//                   >
//                     <div className="absolute -inset-3 bg-gradient-to-r from-[#6366f1] to-[#a855f7] rounded-full blur opacity-30 group-hover:opacity-75 transition duration-300" />
//                     <div className="relative p-4 bg-gray-100 dark:bg-white/10 backdrop-blur-sm rounded-full border border-gray-300 dark:border-white/20 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-300 transform hover:scale-110">
//                       <Icon className="w-6 h-6" />
//                     </div>
//                   </a>
//                 );
//               })}
//             </div>
//             <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-sm">
//               Connect with us on social media for the latest updates and DSA tips!
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ContactUs;
