import React, { useState } from 'react';
import { MOCK_COURSE, MOCK_REVIEWS } from '../constants';
import { Course, GradeType, Review } from '../types';
import { Badge } from './Badge';
import { Star, ThumbsUp, MessageSquare, Share2, Users, ArrowRight, GitBranch, Clock, ChevronDown, ChevronUp, ArrowLeft, ExternalLink, FileText, Check, Send } from 'lucide-react';

interface CourseDetailProps {
    course?: Course;
    onBack: () => void;
    onWriteReview: () => void;
}

const getStatColor = (grade: GradeType) => {
    switch(grade) {
        case GradeType.A: return "bg-emerald-500";
        case GradeType.AB: return "bg-emerald-400";
        case GradeType.B: return "bg-blue-500";
        case GradeType.BC: return "bg-blue-400";
        case GradeType.C: return "bg-amber-400";
        case GradeType.D: return "bg-orange-400";
        case GradeType.F: return "bg-red-500";
        default: return "bg-slate-300";
    }
};

// Helper to get width percentage based on grade roughly
const getStatWidth = (grade: GradeType) => {
    switch(grade) {
        case GradeType.A: return "100%";
        case GradeType.AB: return "90%";
        case GradeType.B: return "80%";
        case GradeType.BC: return "70%";
        case GradeType.C: return "60%";
        case GradeType.D: return "40%";
        case GradeType.F: return "20%";
        default: return "50%";
    }
};

export const CourseDetail: React.FC<CourseDetailProps> = ({ course = MOCK_COURSE, onBack, onWriteReview }) => {
  const [showAllInstructors, setShowAllInstructors] = useState(false);
  // State to manage reviews (allows adding comments locally)
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  // State to track which review has comments expanded
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  // State to track new comment text per review
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const visibleInstructors = showAllInstructors ? course.instructors : course.instructors.slice(0, 3);
  const hasMoreInstructors = course.instructors.length > 3;

  const toggleComments = (reviewId: string) => {
      const newExpanded = new Set(expandedComments);
      if (newExpanded.has(reviewId)) {
          newExpanded.delete(reviewId);
      } else {
          newExpanded.add(reviewId);
      }
      setExpandedComments(newExpanded);
  };

  const handleAddComment = (reviewId: string) => {
      const text = commentInputs[reviewId];
      if (!text || text.trim() === "") return;

      const newComment = {
          id: Date.now().toString(),
          author: "You",
          date: "Just now",
          text: text
      };

      const updatedReviews = reviews.map(r => {
          if (r.id === reviewId) {
              return { ...r, comments: [...r.comments, newComment] };
          }
          return r;
      });

      setReviews(updatedReviews);
      setCommentInputs({ ...commentInputs, [reviewId]: "" });
  };

  return (
    <div className="space-y-8">
      {/* Back Nav */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-2 group"
      >
        <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-slate-300 shadow-sm">
            <ArrowLeft size={14} />
        </div>
        Back to Catalog
      </button>

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-soft animate-slide-in">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-3">
               <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                {course.code}
                <span className="text-slate-300 font-light text-2xl">/</span>
                <span className="text-xl md:text-2xl">{course.name}</span>
              </h1>
              <Badge text={`${course.credits} credits`} variant="subtle" className="bg-slate-100 text-slate-600 border-slate-200" />
            </div>
            
            <div className="mb-5">
                <span className="inline-block px-2.5 py-1 rounded-md bg-red-50 text-uw-red text-xs font-semibold border border-red-100 uppercase tracking-wide">
                    {course.school}
                </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-slate-500 mb-6 border-b border-slate-100 pb-6">
                <button className="flex items-center gap-1.5 hover:text-uw-red transition-colors group">
                    <Star size={16} className="group-hover:fill-uw-red" />
                    <span>Add to Favourites</span>
                </button>
                <button className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                    <Share2 size={16} />
                    <span>Share Course</span>
                </button>
            </div>

            <p className="text-slate-600 leading-7 text-sm md:text-base max-w-3xl mb-8">
              {course.description}
            </p>
            
             {/* Instructors List */}
             <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Users size={14} />
                    Instructors History
                </h4>
                <div className="flex flex-wrap gap-2">
                    {visibleInstructors.map(inst => (
                        <div key={inst} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-700 font-medium hover:border-slate-300 transition-colors">
                            {inst}
                        </div>
                    ))}
                    {hasMoreInstructors && (
                        <button 
                            onClick={() => setShowAllInstructors(!showAllInstructors)}
                            className="px-3 py-1 bg-white border border-slate-200 border-dashed rounded-full text-xs text-uw-red hover:bg-red-50 flex items-center gap-1 transition-colors"
                        >
                            {showAllInstructors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {showAllInstructors ? 'Show Less' : `+${course.instructors.length - 3} others`}
                        </button>
                    )}
                </div>
            </div>

            {/* Academic Journey Map */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <GitBranch size={14} className="text-indigo-500" />
                    Course Dependency Map
                </h4>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 overflow-x-auto pb-2 md:pb-0">
                    {/* Pre-reqs */}
                    <div className="flex-shrink-0">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-2 pl-1">Prerequisites</div>
                        <div className="flex flex-col gap-2">
                            {course.prerequisites === "None" ? (
                                <span className="text-xs text-slate-400 italic px-2">None</span>
                            ) : (
                                course.prerequisites.split(' and ').map((part, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        {i > 0 && <span className="text-[10px] text-slate-400 font-mono bg-white px-1 border rounded">AND</span>}
                                        <span className="px-3 py-1.5 bg-white border-l-4 border-amber-400 border-y border-r border-slate-200 rounded text-xs font-semibold text-slate-700 shadow-sm">
                                            {part.replace(/[()]/g, '')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* Connection */}
                    <div className="hidden md:flex text-slate-300">
                        <ArrowRight size={20} />
                    </div>
                    <div className="md:hidden text-slate-300 self-start ml-8 my-1 transform rotate-90">
                        <ArrowRight size={20} />
                    </div>

                    {/* Current */}
                    <div className="flex-shrink-0">
                         <div className="text-[10px] text-slate-400 uppercase font-bold mb-2 pl-1">This Course</div>
                         <div className="px-5 py-2.5 bg-uw-red text-white rounded-lg text-sm font-bold shadow-md shadow-red-200 ring-2 ring-red-100 ring-offset-2">
                            {course.code}
                         </div>
                    </div>

                    {/* Connection */}
                    <div className="hidden md:flex text-slate-300">
                        <ArrowRight size={20} />
                    </div>
                     <div className="md:hidden text-slate-300 self-start ml-8 my-1 transform rotate-90">
                        <ArrowRight size={20} />
                    </div>

                    {/* Unlocks */}
                     <div className="flex-shrink-0">
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-2 pl-1">Unlocks</div>
                        <div className="flex flex-wrap gap-2 max-w-xs">
                            {course.leadsTo.length > 0 ? course.leadsTo.map(code => (
                                <span key={code} className="px-3 py-1.5 bg-white border-l-4 border-emerald-400 border-y border-r border-slate-200 rounded text-xs font-semibold text-slate-700 shadow-sm hover:border-emerald-500 hover:-translate-y-0.5 transition-all cursor-pointer">
                                    {code}
                                </span>
                            )) : (
                                <span className="text-xs text-slate-400 italic px-2">End of sequence</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

          </div>
          
          {/* Right Sidebar of Header */}
          <div className="flex flex-col items-stretch gap-4 w-full lg:w-64 flex-shrink-0">
             <button 
                onClick={onWriteReview}
                className="w-full px-4 py-3 bg-uw-red text-white text-sm font-bold rounded-lg hover:bg-uw-dark transition-all shadow-lg shadow-red-100 active:scale-95 flex items-center justify-center gap-2"
             >
                <FileText size={16} />
                Write a Review
             </button>
             
             <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Clock size={12} />
                    Recent Terms
                 </div>
                 <div className="flex flex-wrap gap-1.5">
                    {course.terms.slice(0,6).map(term => (
                        <span key={term} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-medium text-slate-600">
                            {term}
                        </span>
                    ))}
                 </div>
             </div>
          </div>
        </div>
        
        {/* Course Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-slate-100 pt-8">
           {[
               { label: 'Content Quality', score: course.stats.contentScore },
               { label: 'Teaching', score: course.stats.teachingScore },
               { label: 'Grading Fairness', score: course.stats.gradingScore },
               { label: 'Workload', score: course.stats.workloadScore },
           ].map((stat) => (
               <div key={stat.label} className="flex flex-col gap-2 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                   <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</span>
                   <div className="flex items-center gap-3">
                       <Badge grade={stat.score} className="text-lg w-12 h-8 shadow-sm" />
                       <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${getStatColor(stat.score)}`} 
                                style={{ width: getStatWidth(stat.score) }}
                            ></div>
                       </div>
                   </div>
               </div>
           ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row">
                {/* Left Metadata Column */}
                <div className="md:w-48 bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-100 p-5 flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-600">
                            {review.author.substring(0,2).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-slate-700 truncate">{review.author}</span>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="text-xs text-slate-400 uppercase font-semibold">Taken</div>
                        <div className="text-sm font-medium text-slate-800">{review.term}</div>
                    </div>
                     <div className="space-y-1">
                        <div className="text-xs text-slate-400 uppercase font-semibold">Prof</div>
                        <div className="text-xs font-medium text-slate-700">{review.instructor}</div>
                    </div>
                    
                    <div className="mt-auto pt-3">
                         <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Grade Rec'd</div>
                         <Badge grade={review.gradeReceived} variant="subtle" />
                    </div>
                </div>

                {/* Right Content Column */}
                <div className="flex-1 p-5 md:p-6">
                    {/* Title & Ratings Row */}
                    <div className="flex flex-col gap-4 mb-5 border-b border-slate-50 pb-4">
                         <div className="flex items-start justify-between gap-4">
                            {review.title ? (
                                <h4 className="font-bold text-slate-900 text-lg leading-tight">{review.title}</h4>
                            ) : (
                                <div className="h-6"></div> 
                            )}
                            
                            {/* Quick Mini Ratings */}
                            <div className="flex gap-1 flex-wrap justify-end">
                                {[
                                    { label: 'C', grade: review.ratings.content, tip: 'Content' },
                                    { label: 'T', grade: review.ratings.teaching, tip: 'Teaching' },
                                    { label: 'G', grade: review.ratings.grading, tip: 'Grading' },
                                    { label: 'W', grade: review.ratings.workload, tip: 'Workload' }
                                ].map(r => (
                                    <div key={r.label} title={r.tip} className="flex flex-col items-center bg-slate-50 px-1.5 py-1 rounded border border-slate-100 min-w-[32px]">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">{r.label}</span>
                                        <span className={`text-xs font-bold ${getStatColor(r.grade).replace('bg-', 'text-')}`}>{r.grade}</span>
                                    </div>
                                ))}
                            </div>
                         </div>
                    </div>

                    {/* Tags & Assessments */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {review.tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] rounded-full font-medium border border-slate-200">
                                #{tag}
                            </span>
                        ))}
                        {review.assessments?.map(a => (
                             <span key={a} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] rounded-full font-semibold border border-indigo-100">
                                <Check size={10} />
                                {a}
                            </span>
                        ))}
                    </div>
                    
                    {/* Detailed Comments per Dimension OR Legacy Text */}
                    {review.dimensionComments ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                            {Object.entries(review.dimensionComments).map(([key, text]) => (
                                <div key={key} className="bg-slate-50/80 p-3.5 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                                    <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                                        <div className={`w-1.5 h-1.5 rounded-full ${getStatColor(review.ratings[key as keyof typeof review.ratings])}`}></div>
                                        {key}
                                    </h5>
                                    <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-700 text-sm leading-relaxed mb-4 bg-slate-50 p-4 rounded-lg">
                            {review.text}
                        </p>
                    )}
                    
                    {/* Resource Link Display */}
                    {review.resourceLink && (
                      <div className="mb-5">
                        <a 
                          href={review.resourceLink} 
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm group"
                        >
                          <ExternalLink size={14} className="group-hover:-translate-y-0.5 transition-transform" />
                          View Shared Resources (Drive/Box)
                        </a>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-400 text-xs mt-4 pt-4 border-t border-slate-50">
                        <span>Posted on {review.date}</span>
                        
                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                                <ThumbsUp size={14} />
                                <span className="font-medium">{review.likes} Helpful</span>
                            </button>
                             <button 
                                onClick={() => toggleComments(review.id)}
                                className={`flex items-center gap-1.5 transition-colors ${expandedComments.has(review.id) ? 'text-blue-600' : 'hover:text-blue-600'}`}
                            >
                                <MessageSquare size={14} />
                                <span>{review.comments.length} Comments</span>
                                {expandedComments.has(review.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                        </div>
                    </div>

                    {/* Comments Section */}
                    {expandedComments.has(review.id) && (
                        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 -mx-5 -mb-5 px-5 pb-5 animate-fade-in">
                             <div className="space-y-3 mb-4">
                                {review.comments.length > 0 ? (
                                    review.comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3">
                                            <div className="w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                                                {comment.author.substring(0,2).toUpperCase()}
                                            </div>
                                            <div className="flex-1 bg-white border border-slate-200 rounded-lg rounded-tl-none p-3 text-sm shadow-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold text-slate-800 text-xs">{comment.author}</span>
                                                    <span className="text-[10px] text-slate-400">{comment.date}</span>
                                                </div>
                                                <p className="text-slate-700">{comment.text}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-xs text-slate-400 py-2 italic">
                                        No comments yet. Be the first to ask a question!
                                    </div>
                                )}
                             </div>
                             
                             {/* Add Comment Input */}
                             <div className="flex gap-2 items-end">
                                <div className="w-6 h-6 bg-uw-red rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mb-2">
                                    ME
                                </div>
                                <div className="flex-1 relative">
                                    <textarea
                                        value={commentInputs[review.id] || ''}
                                        onChange={(e) => setCommentInputs({...commentInputs, [review.id]: e.target.value})}
                                        placeholder="Ask a question or reply..."
                                        className="w-full p-3 pr-10 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none h-20 custom-scrollbar"
                                    />
                                    <button 
                                        onClick={() => handleAddComment(review.id)}
                                        disabled={!commentInputs[review.id]?.trim()}
                                        className="absolute bottom-2 right-2 p-1.5 bg-slate-100 text-slate-400 hover:bg-uw-red hover:text-white rounded-md disabled:opacity-50 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 transition-colors"
                                    >
                                        <Send size={14} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};