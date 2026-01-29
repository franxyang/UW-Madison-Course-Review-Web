import React, { useState } from 'react';
import { Course, GradeType } from '../types';
import { ArrowLeft, Check, Upload, AlertCircle } from 'lucide-react';

interface ReviewFormProps {
  course: Course;
  onBack: () => void;
  onSubmit: () => void;
}

const GRADE_OPTIONS: GradeType[] = [GradeType.A, GradeType.AB, GradeType.B, GradeType.BC, GradeType.C, GradeType.D, GradeType.F];

const ASSESSMENT_OPTIONS = [
  "Mid-term Exam", "Final Exam", "Quiz", "Assignment",
  "Essay", "Project", "Attendance", "Reading Material", "Presentation"
];

const PLACEHOLDERS = {
    content: `Example:
This course touches on the basics of [Subject]. The course covers:
1. Major Topic A (e.g. Energy Balance)
2. Major Topic B (e.g. Heat Transfer)
3. Major Topic C (e.g. Fluid flow)
4. Major Topic D

The content is designed well for first-year students as it introduces concepts clearly. I felt that it lacked depth in some areas, but it was understandable since it's an introductory course.`,

    teaching: `Example:
I really enjoyed [Instructor Name]'s teaching. Since the course was less packed, the pace was slower than most courses I took.

In the lecture, she mixed up demonstrations and lab sessions to learn in a more 'enjoyable' way. I was able to understand her lectures without much difficulty. TAs are also nice and patient.`,

    grading: `Example:
- Participation: 10%
- Project: 20%
- Final Exam: 35%
- Lab reports: 15% (3 x 5)
- Homework: 20%

Very satisfied with the grading. Lab reports are mostly easy to get high grades in if you come to sessions. Homework can be tricky, but you can ask TAs if you aren't sure. The final exam is open book so not much pressure.`,

    workload: `Example:
If you learned [Related Subject] in high school, then you already know 70% of the course, so you wouldn't need to study much.

There are only 5 questions in each homework as well, compared to 10 in maths and physics, this is very light. Overall, this course is considered a very light/heavy course in the department.`
};

// A dimension card with text area on left and vertical grading strip on right
// Background color changes based on grade selected
const DimensionInput = ({ 
  label, 
  rating, 
  comment, 
  placeholder,
  onRatingChange,
  onCommentChange 
}: { 
  label: string; 
  rating: GradeType | null; 
  comment: string;
  placeholder: string;
  onRatingChange: (g: GradeType) => void;
  onCommentChange: (val: string) => void;
}) => {
    // Color logic for selection
    const getRatingButtonClass = (g: GradeType) => {
        if (rating !== g) return "text-slate-400 hover:bg-white/50 hover:text-slate-600";
        
        // When selected, show solid color
        switch(g) {
            case GradeType.A: return "bg-green-500 text-white shadow-md";
            case GradeType.AB: return "bg-green-400 text-white shadow-md";
            case GradeType.B: return "bg-blue-500 text-white shadow-md";
            case GradeType.BC: return "bg-blue-400 text-white shadow-md";
            case GradeType.C: return "bg-yellow-400 text-white shadow-md";
            case GradeType.D: return "bg-orange-400 text-white shadow-md";
            case GradeType.F: return "bg-red-500 text-white shadow-md";
            default: return "bg-slate-500 text-white";
        }
    };

    // Dynamic Card Background based on Rating
    const getCardStyle = () => {
        if (!rating) return "bg-white border-slate-200";
        switch(rating) {
            case GradeType.A: 
            case GradeType.AB:
                return "bg-emerald-50/50 border-emerald-200"; // Good
            case GradeType.B:
            case GradeType.BC:
                return "bg-blue-50/50 border-blue-200"; // Okay
            case GradeType.C:
                return "bg-amber-50/50 border-amber-200"; // Average
            case GradeType.D:
                return "bg-orange-50/50 border-orange-200"; // Poor
            case GradeType.F:
                return "bg-red-50/50 border-red-200"; // Bad
            default:
                return "bg-white border-slate-200";
        }
    };

  return (
    <div className={`border rounded-xl overflow-hidden flex flex-col h-full transition-all duration-300 shadow-sm ${getCardStyle()}`}>
      <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between bg-white/40">
         <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</span>
         {rating && (
             <span className="text-[10px] px-2 py-0.5 rounded-full bg-white shadow-sm border border-black/5 text-slate-800 font-bold">
                 {rating}
             </span>
         )}
      </div>
      
      <div className="flex flex-1">
        {/* Text Area */}
        <textarea
            value={comment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 p-4 text-sm text-slate-800 placeholder-slate-400 bg-transparent resize-none outline-none min-h-[160px] leading-relaxed"
        />
        
        {/* Vertical Rating Strip */}
        <div className="w-12 border-l border-black/5 flex flex-col items-center justify-center gap-1 py-2 bg-white/30">
            {GRADE_OPTIONS.map((g) => (
                <button
                    key={g}
                    type="button"
                    onClick={() => onRatingChange(g)}
                    className={`w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${getRatingButtonClass(g)}`}
                >
                    {g}
                </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export const ReviewForm: React.FC<ReviewFormProps> = ({ course, onBack, onSubmit }) => {
  // General Info
  const [term, setTerm] = useState(course.terms[0] || '');
  const [title, setTitle] = useState('');
  const [instructor, setInstructor] = useState(course.instructors[0] || '');
  
  // Dimensions
  const [contentData, setContentData] = useState({ rating: null as GradeType | null, comment: '' });
  const [teachingData, setTeachingData] = useState({ rating: null as GradeType | null, comment: '' });
  const [gradingData, setGradingData] = useState({ rating: null as GradeType | null, comment: '' });
  const [workloadData, setWorkloadData] = useState({ rating: null as GradeType | null, comment: '' });

  // Assessments
  const [assessments, setAssessments] = useState<string[]>([]);
  const [resourceLink, setResourceLink] = useState('');

  const toggleAssessment = (item: string) => {
      if (assessments.includes(item)) {
          setAssessments(assessments.filter(i => i !== item));
      } else {
          setAssessments([...assessments, item]);
      }
  };
  
  const isValid = 
    title.length > 5 &&
    contentData.rating && contentData.comment.length > 5 &&
    teachingData.rating &&
    gradingData.rating &&
    workloadData.rating;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 group"
      >
        <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm">
            <ArrowLeft size={14} />
        </div>
        Cancel Review
      </button>

      <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Rate & Review</h1>
          <p className="text-slate-500">Share your experience in <span className="font-bold text-slate-900">{course.code}: {course.name}</span> to help other Badgers.</p>
      </div>

      {/* Form Container */}
      <div className="space-y-8">
        
        {/* Top Row: Semester & Title */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semester Taken</label>
                <select 
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red outline-none font-medium"
                >
                    <option>Not Specified</option>
                    {course.terms.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            <div className="md:col-span-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Review Title</label>
                 <input 
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g., Great content but tough exams..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red outline-none placeholder:text-slate-400 font-medium"
                 />
            </div>
        </div>

        {/* Instructor Row */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instructor(s)</label>
             <select 
                value={instructor}
                onChange={e => setInstructor(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red outline-none"
            >
                <option value="">Select Instructor (Optional)</option>
                {course.instructors.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <div className="mt-3 text-xs text-slate-400 flex flex-wrap gap-2 items-center">
                <span>Quick Select:</span>
                {course.instructors.slice(0,4).map(i => (
                    <button 
                        key={i} 
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors" 
                        onClick={() => setInstructor(i)}
                    >
                        {i}
                    </button>
                ))}
            </div>
        </div>

        {/* 4-Dimension Grid */}
        <div>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Detailed Ratings</h3>
                <span className="text-xs text-slate-500">Select a grade on the right to color-code your rating.</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DimensionInput 
                    label="Content Quality"
                    rating={contentData.rating}
                    comment={contentData.comment}
                    placeholder={PLACEHOLDERS.content}
                    onRatingChange={(r) => setContentData({...contentData, rating: r})}
                    onCommentChange={(c) => setContentData({...contentData, comment: c})}
                />
                <DimensionInput 
                    label="Teaching Effectiveness"
                    rating={teachingData.rating}
                    comment={teachingData.comment}
                    placeholder={PLACEHOLDERS.teaching}
                    onRatingChange={(r) => setTeachingData({...teachingData, rating: r})}
                    onCommentChange={(c) => setTeachingData({...teachingData, comment: c})}
                />
                <DimensionInput 
                    label="Grading Fairness"
                    rating={gradingData.rating}
                    comment={gradingData.comment}
                    placeholder={PLACEHOLDERS.grading}
                    onRatingChange={(r) => setGradingData({...gradingData, rating: r})}
                    onCommentChange={(c) => setGradingData({...gradingData, comment: c})}
                />
                <DimensionInput 
                    label="Workload Manageability"
                    rating={workloadData.rating}
                    comment={workloadData.comment}
                    placeholder={PLACEHOLDERS.workload}
                    onRatingChange={(r) => setWorkloadData({...workloadData, rating: r})}
                    onCommentChange={(c) => setWorkloadData({...workloadData, comment: c})}
                />
            </div>
        </div>

        {/* Warning Banner */}
        {!isValid && (
            <div className="flex items-center justify-center p-3 bg-amber-50 border border-amber-100 rounded-lg text-amber-700 text-xs font-medium gap-2">
                <AlertCircle size={14} />
                Please fill in all dimensions and provide a title to submit.
            </div>
        )}

        {/* Assessments / Materials */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="font-bold text-slate-900 mb-1">Assessments & Materials</h3>
             <p className="text-xs text-slate-500 mb-6">What did this course consist of? Select all that apply.</p>
             
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ASSESSMENT_OPTIONS.map(opt => {
                    const isChecked = assessments.includes(opt);
                    return (
                        <label key={opt} className="flex items-center gap-3 cursor-pointer group select-none">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ${isChecked ? 'bg-uw-red border-uw-red scale-110' : 'bg-white border-slate-300 group-hover:border-slate-400'}`}>
                                {isChecked && <Check size={12} className="text-white" />}
                            </div>
                            <span className={`text-sm transition-colors ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>{opt}</span>
                             <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleAssessment(opt)} />
                        </label>
                    );
                })}
             </div>
             
             <div className="mt-8 pt-6 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Share Resources (Optional)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Upload size={14} className="text-slate-400" />
                            </div>
                            <input 
                                type="url" 
                                value={resourceLink}
                                onChange={e => setResourceLink(e.target.value)}
                                placeholder="Paste Google Drive / Box / DropBox link..."
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                            />
                        </div>
                        <p className="mt-1.5 text-[10px] text-slate-400">
                            Upload notes, past exams, or study guides to a cloud drive and share the link here.
                        </p>
                    </div>
                </div>
             </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4">
            <button onClick={onBack} className="text-slate-500 text-sm font-medium hover:text-uw-red px-4 py-2 rounded hover:bg-slate-50 transition-colors">
                Return to review page
            </button>
            <button 
                onClick={onSubmit}
                disabled={!isValid}
                className={`px-8 py-3 text-sm font-bold text-white rounded-lg shadow-md transition-all flex items-center gap-2 ${
                isValid 
                    ? 'bg-uw-red hover:bg-uw-dark hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5' 
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
            >
                Submit Review
            </button>
        </div>

      </div>
    </div>
  );
};