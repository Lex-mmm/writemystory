"use client";

interface PeriodProgress {
  answered: number;
  total: number;
  percentage: number;
  categories: string[];
}

interface ProgressDetail {
  early_childhood?: PeriodProgress;
  school_years?: PeriodProgress;
  young_adult?: PeriodProgress;
  adult_life?: PeriodProgress;
  later_life?: PeriodProgress;
}

interface Project {
  id: string;
  progress?: number;
  progress_detail?: ProgressDetail;
  period_type: string;
  subject_type: string;
}

interface ProgressVisualizationProps {
  project: Project;
  compact?: boolean;
}

export default function ProgressVisualization({ project, compact = false }: ProgressVisualizationProps) {
  const lifePeriods = {
    early_childhood: {
      name: "Vroege Jeugd",
      emoji: "🍼",
      color: "bg-pink-500",
      lightColor: "bg-pink-100"
    },
    school_years: {
      name: "Schooltijd",
      emoji: "🎓",
      color: "bg-blue-500",
      lightColor: "bg-blue-100"
    },
    young_adult: {
      name: "Jong Volwassen",
      emoji: "🌟",
      color: "bg-green-500",
      lightColor: "bg-green-100"
    },
    adult_life: {
      name: "Volwassen Leven",
      emoji: "💼",
      color: "bg-purple-500",
      lightColor: "bg-purple-100"
    },
    later_life: {
      name: "Later Leven",
      emoji: "🌅",
      color: "bg-orange-500",
      lightColor: "bg-orange-100"
    }
  };

  // Filter periods based on project scope
  const getRelevantPeriods = () => {
    if (project.period_type === 'youth') {
      return ['early_childhood', 'school_years'];
    } else if (project.period_type === 'specificPeriod') {
      // Could be more intelligent based on start/end years
      return ['young_adult', 'adult_life'];
    }
    // Full life story
    return Object.keys(lifePeriods);
  };

  const relevantPeriods = getRelevantPeriods();
  const progressDetail = project.progress_detail || {};

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Voortgang</span>
          <span className="text-sm text-gray-600">{project.progress || 15}% voltooid</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${project.progress || 15}%` }}
          ></div>
        </div>
        <div className="flex gap-1">
          {relevantPeriods.map((periodKey) => {
            const period = lifePeriods[periodKey as keyof typeof lifePeriods];
            const progress = progressDetail[periodKey as keyof ProgressDetail];
            const percentage = progress?.percentage || 0;
            
            return (
              <div
                key={periodKey}
                className={`h-1 flex-1 rounded ${
                  percentage > 0 ? period.color : 'bg-gray-200'
                }`}
                style={{ opacity: percentage > 0 ? Math.max(0.3, percentage / 100) : 1 }}
                title={`${period.name}: ${percentage}%`}
              ></div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Voortgang per levensperiode</h3>
        <span className="text-2xl font-bold text-blue-600">{project.progress || 15}%</span>
      </div>

      <div className="space-y-4">
        {relevantPeriods.map((periodKey) => {
          const period = lifePeriods[periodKey as keyof typeof lifePeriods];
          const progress = progressDetail[periodKey as keyof ProgressDetail];
          const percentage = progress?.percentage || 0;
          const answered = progress?.answered || 0;
          const total = progress?.total || 0;

          return (
            <div key={periodKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{period.emoji}</span>
                  <span className="font-medium text-gray-700">{period.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {answered}/{total} vragen
                </div>
              </div>
              
              <div className="relative">
                <div className={`w-full ${period.lightColor} rounded-full h-3`}>
                  <div 
                    className={`${period.color} h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  >
                    {percentage > 15 && (
                      <span className="text-xs text-white font-medium">
                        {percentage}%
                      </span>
                    )}
                  </div>
                </div>
                {percentage <= 15 && percentage > 0 && (
                  <span className="absolute left-2 top-0 text-xs text-gray-600 leading-3">
                    {percentage}%
                  </span>
                )}
              </div>

              {total === 0 && (
                <p className="text-xs text-gray-500 italic">
                  Nog geen vragen voor deze periode
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Totaal beantwoorde vragen:</span>
          <span className="font-medium">
            {Object.values(progressDetail).reduce((sum, period) => sum + (period?.answered || 0), 0)} van {Object.values(progressDetail).reduce((sum, period) => sum + (period?.total || 0), 0)}
          </span>
        </div>
      </div>
    </div>
  );
}
