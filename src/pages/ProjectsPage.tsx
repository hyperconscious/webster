import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { type Project, type Theme, PRESET_SIZES } from '../types';
import {
    Palette,
    Plus,
    Trash2,
    Copy,
    ExternalLink,
    Sun,
    Moon,
    LayoutGrid,
    FileText,
    Grid3X3
} from 'lucide-react';
import CreateProjectModal from '../components/CreateProjectModal';
import ProjectService from '../services/ProjectService';
import { notifyError, notifySuccess } from '../utils/notification';

interface ProjectsPageProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

type ProjectView = 'projects' | 'templates';

const ProjectsPage: React.FC<ProjectsPageProps> = ({ theme, setTheme }) => {
    const navigator = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [view, setView] = useState<ProjectView>('projects');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const projectsPerPage = 12;

    const getThemeClasses = () => {
        switch (theme) {
            case 'light':
                return {
                    bg: 'bg-gray-50',
                    sidebar: 'bg-white border-gray-200',
                    card: 'bg-white border-gray-200 hover:border-gray-300',
                    text: 'text-gray-900',
                    button: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                    activeNav: 'bg-gray-100 text-gray-900',
                    inactiveNav: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                };
            case 'blue':
                return {
                    bg: 'bg-blue-950',
                    sidebar: 'bg-blue-900 border-blue-800',
                    card: 'bg-blue-900 border-blue-800 hover:border-blue-700',
                    text: 'text-white',
                    button: 'bg-blue-800 hover:bg-blue-700 text-blue-100',
                    activeNav: 'bg-blue-800 text-white',
                    inactiveNav: 'text-blue-300 hover:text-white hover:bg-blue-800'
                };
            default:
                return {
                    bg: 'bg-gray-900',
                    sidebar: 'bg-gray-800 border-gray-700',
                    card: 'bg-gray-800 border-gray-700 hover:border-gray-600',
                    text: 'text-white',
                    button: 'bg-gray-700 hover:bg-gray-600 text-gray-300',
                    activeNav: 'bg-gray-700 text-white',
                    inactiveNav: 'text-gray-400 hover:text-white hover:bg-gray-700'
                };
        }
    };

    const themeClasses = getThemeClasses();

    useEffect(() => {
        fetchProjects();
    }, [page, view]);

    const fetchProjects = async () => {
        try {
            const response = await ProjectService.getMyProjects({ page, limit: projectsPerPage, filters: { isTemplate: view === 'templates' } });
            setProjects(response.data);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteProject = async (projectSlug: string) => {
        try {
            await ProjectService.deleteProject(projectSlug);
            setProjects(projects.filter(p => p.slug !== projectSlug));
            notifySuccess('Project deleted successfully.');
        } catch (error) {
            notifyError('Failed to delete project. Please try again.');
        }
    };

    const duplicateProject = async (project: Project) => {
        try {
            const response = await ProjectService.copyProject(project.slug);
            setProjects([response, ...projects]);
            notifySuccess('Project duplicated successfully.');
        } catch (error) {
            notifyError('Failed to duplicate project. Please try again.');
        }
    };

    const useTemplate = async (template: Project) => {
        try {
            const newProject = {
                ...template,
                slug: '',
                name: 'untitled',
                isTemplate: false,
            };
            const response = await ProjectService.createProject(newProject);
            navigator(`/projects/${response.slug}`);
        } catch (error) {
            notifyError('Failed to apply template. Please try again.');
        }
    };

    const handleThemeChange = () => {
        const themes: Theme[] = ['light', 'dark', 'blue'];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    };


    const renderProjects = () => (
        <>
            {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <FileText size={64} className="text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium mb-2">{view === 'templates' ? 'No templates yet' : 'No projects yet'}</h3>
                    <p className="text-sm opacity-75 mb-6">{view === 'projects' && 'Create your first project to get started'}</p>
                    {view === 'projects' && (<button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Create Project
                    </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projects.map(project => (
                        <div
                            key={project.id}
                            className={`${themeClasses.card} rounded-xl border p-4 space-y-4 transition-all transform hover:scale-105 hover:shadow-lg duration-300`}
                        >
                            <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-900">
                                <img
                                    src={project.thumbnail || '/placeholder.png'}
                                    alt={project.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div>
                                <h3 className="font-medium text-lg">{project.name}</h3>
                                <p className="text-sm opacity-75">
                                    {JSON.parse(project.data).width} × {JSON.parse(project.data).height}
                                </p>
                                <p className="text-sm opacity-75">
                                    Last edited: {new Date(project.updatedAt).toLocaleDateString()} {new Date(project.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {view === 'projects' ? <Link
                                    to={`/projects/${project.slug}`}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    Open
                                </Link>
                                    :
                                    <button
                                        onClick={() => useTemplate(project)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
                                    >
                                        <Plus size={16} />
                                        Use Template
                                    </button>
                                }
                                <button
                                    onClick={() => duplicateProject(project)}
                                    className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
                                    title="Duplicate Project"
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                                            deleteProject(project.slug);
                                        }
                                    }}
                                    className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
                                    title="Delete Project"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`px-4 py-2 rounded-lg transition-colors ${page === i + 1
                                ? 'bg-blue-600 text-white'
                                : `${themeClasses.button}`
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
            )}
        </>
    );

    return (
        <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text}`}>
            <div className="flex h-screen">
                {/* Sidebar */}
                <div className={`w-64 flex-shrink-0 border-r ${themeClasses.sidebar}`}>
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-8">
                            <Palette className="text-blue-500" size={24} />
                            <h1 className="text-xl font-bold">Canvas Editor</h1>
                        </div>

                        <div className="space-y-1">
                            <button
                                onClick={() => setView('projects')}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${view === 'projects' ? themeClasses.activeNav : themeClasses.inactiveNav
                                    }`}
                            >
                                <LayoutGrid size={18} />
                                My Projects
                            </button>
                            <button
                                onClick={() => setView('templates')}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${view === 'templates' ? themeClasses.activeNav : themeClasses.inactiveNav
                                    }`}
                            >
                                <Grid3X3 size={18} />
                                Templates
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto">
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold">
                                {view === 'projects' ? 'My Projects' : 'Templates'}
                            </h2>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleThemeChange}
                                    className={`p-2 rounded-lg transition-colors ${themeClasses.button}`}
                                >
                                    {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
                                </button>

                                {view === 'projects' && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <Plus size={20} />
                                        New Project
                                    </button>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                            </div>
                        ) : (
                            renderProjects()
                        )}
                    </div>
                </div>
            </div>

            <CreateProjectModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                theme={theme}
            />
        </div>
    );
};

export default ProjectsPage;