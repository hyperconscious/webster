import { useState, useEffect, useRef } from "react"
import { Calendar, Code, GitBranch, Star, Edit3, Save, X, RefreshCw, ArrowLeft, Camera, User, Mail, LogIn, Palette, Activity, TrendingUp, Award, Zap, Edit2, Plus } from 'lucide-react'
import { useDropzone } from "react-dropzone"
import { useForm } from "react-hook-form"
import PasswordModal from '../components/PasswordConfirmModal';
import type { Project, Theme } from "../types"
import { useUser } from "../hooks/useUser"
import { updateUserDto, type RegisterData, type UpdateUserData } from "../validation/schemas"
import ProjectService from "../services/ProjectService"
import { zodResolver } from "@hookform/resolvers/zod"
import type z from "zod"
import UserService from "../services/UserService"
import { notifyError, notifySuccess } from "../utils/notification"
import config from "../config/env.config";

const PROJECTS_PER_PAGE = 6
interface Quote {
    text: string
    author: string
}

interface EditorPageProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const Profile: React.FC<EditorPageProps> = ({ theme, setTheme }) => {
    const [isEditing, setIsEditing] = useState(false)
    const [quote, setQuote] = useState<Quote>({ text: "Loading...", author: "" })
    const [isLoadingQuote, setIsLoadingQuote] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const passwordModalResolveRef = useRef<(() => void) | null>(null)
    const { user, setUser } = useUser();
    const [recentProjects, setRecentProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<UpdateUserData>({
        resolver: zodResolver(updateUserDto),
    });

    useEffect(() => {
        if (!user) return;
        fetchrecentProjects();
    }, [user]);

    const fetchrecentProjects = async () => {
        try {
            const response = await ProjectService.getMyProjects({ page: 1, limit: PROJECTS_PER_PAGE, sortDirection: 'DESC', sortBy: 'updatedAt' });
            console.log("Recent projects fetched:", response.data);
            setRecentProjects(response.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDrop = async (acceptedFiles: File[]) => {
        if (!user) return
        const file = acceptedFiles[0]
        if (file) {
            const formData = new FormData()
            formData.append("avatar", file)
            try {
                const response = await UserService.uploadAvatar(user.id, formData)
                setUser(response);
                notifySuccess("Avatar uploaded successfully")
            } catch (error) {
                notifyError("Failed to upload avatar")
            }
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        maxSize: 5242880,
        maxFiles: 1,
    })

    const fetchQuote = async () => {
        setIsLoadingQuote(true)
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000))
            const quotes = [
                { text: "Code is like humor. When you have to explain it, it's bad.", author: "Cory House" },
                { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
                { text: "Experience is the name everyone gives to their mistakes.", author: "Oscar Wilde" },
                { text: "In order to be irreplaceable, one must always be different.", author: "Coco Chanel" },
                { text: "Java is to JavaScript what car is to Carpet.", author: "Chris Heilmann" },
            ]
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
            setQuote(randomQuote)
        } catch (error) {
            setQuote({ text: "Failed to load quote", author: "" })
        } finally {
            setIsLoadingQuote(false)
        }
    }

    useEffect(() => {
        fetchQuote()
    }, [])

    useEffect(() => {
        if (user) {
            setValue("full_name", user.full_name)
            setValue("login", user.login)
            setValue("email", user.email)
        } else {
            reset()
        }
    }, [user, setValue, reset])

    const onPasswordConfirm = async (currentPassword: string) => {
        if (!user) {
            notifyError("User not found")
            return
        }
        try {
            const isCredentials = await UserService.verifyCredential(user.id, currentPassword)
            if (!isCredentials) {
                notifyError("Invalid current password")
                return
            }
            notifySuccess("Password changed successfully")
            if (passwordModalResolveRef.current) {
                passwordModalResolveRef.current()
            }
        } catch (e) {
            notifyError("Error changing password")
        }
    }

    const onSubmit = async (data: UpdateUserData) => {
        if (!user) {
            notifyError("User not found")
            return
        }
        try {
            Object.keys(data).forEach((key) => {
                const value = (data as any)[key]
                if (value === "" || value === null || value === undefined) {
                    delete (data as any)[key]
                }
            })

            data.verified = true

            if (data.password) {
                await new Promise<void>((resolve) => {
                    passwordModalResolveRef.current = resolve
                    setShowPasswordModal(true)
                })
            }

            const { passwordConfirmation, ...dataWithoutPasswordConfirmation } = data
            await UserService.updateUserProfile(user.id, dataWithoutPasswordConfirmation)
            notifySuccess("User updated successfully")
            setUser((prev) => prev ? ({ ...prev, ...data, id: prev.id }) : null);
            setIsEditing(false)
            setValue("password", "")
            setValue("passwordConfirmation", "")
        } catch (error) {
            notifyError("Failed to update user")
            console.error("Failed to update user:", error)
        }
    }

    const handleCancel = () => {
        setIsEditing(false)
        reset()
    }

    const getThemeClasses = () => {
        switch (theme) {
            case "light":
                return "bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 text-gray-900"
            case "blue":
                return "bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 text-white"
            default:
                return "bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white"
        }
    }

    const getCardClasses = () => {
        switch (theme) {
            case "light":
                return "bg-white/80 backdrop-blur-xl text-gray-900 border border-white/20 shadow-xl"
            case "blue":
                return "bg-blue-900/30 backdrop-blur-xl text-white border border-blue-700/30 shadow-2xl"
            default:
                return "bg-gray-900/30 backdrop-blur-xl text-white border border-gray-700/30 shadow-2xl"
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "bg-green-500"
            case "completed":
                return "bg-blue-500"
            case "in-progress":
                return "bg-yellow-500"
            default:
                return "bg-gray-500"
        }
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-gray-500 dark:text-gray-300">Loading...</p>
            </div>
        )
    }

    return (
        <div className={`min-h-screen transition-all duration-700 p-4 ${getThemeClasses()}`}>
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="relative max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => window.history.back()}
                            className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300"
                        >
                            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                            Back
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                                <Palette className="text-white" size={24} />
                            </div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Photster
                            </h1>
                        </div>
                    </div>
                </header>

                {/* Quote Section */}
                <div className={`relative overflow-hidden rounded-2xl p-8 text-center ${getCardClasses()}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20"></div>
                    <div className="relative">
                        <div className="flex items-center justify-center gap-4 mb-6">
                            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                Daily Inspiration
                            </h2>
                            <button
                                onClick={fetchQuote}
                                disabled={isLoadingQuote}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-300"
                            >
                                <RefreshCw
                                    className={`h-5 w-5 ${isLoadingQuote ? "animate-spin" : ""} transition-transform duration-300`}
                                />
                            </button>
                        </div>
                        <blockquote className="text-xl md:text-3xl font-medium mb-6 leading-relaxed">
                            "{quote.text}"
                        </blockquote>
                        {quote.author && <cite className="text-lg opacity-80">— {quote.author}</cite>}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Profile Card */}
                    <div className={`xl:col-span-1 rounded-2xl p-6 group hover:scale-105 transition-all duration-500 ${getCardClasses()}`}>
                        <div className="text-center pb-6">
                            <div className="relative mx-auto mb-6">
                                <div
                                    {...getRootProps()}
                                    className={`relative cursor-pointer transition-all duration-300 ${isDragActive ? "scale-110" : ""}`}
                                >
                                    <input {...getInputProps()} />
                                    <div className="relative">
                                        <img
                                            src={`${config.BACKEND_URL}${user.avatar}` || "/placeholder.svg?height=160&width=160"}
                                            alt={user.login}
                                            className="h-40 w-40 rounded-full border-4 border-white/20 shadow-2xl transition-all duration-300 group-hover:shadow-purple-500/25 object-cover mx-auto"
                                        />
                                        <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3 border-4 border-white/20 hover:scale-110 transition-all duration-300">
                                            <Camera className="h-5 w-5 text-white" />
                                        </div>
                                        {isDragActive && (
                                            <div className="absolute inset-0 bg-blue-500/20 rounded-full flex items-center justify-center">
                                                <p className="text-white font-medium">Drop image here</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white/20">
                                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                                {user.full_name}
                            </h2>
                            <p className="text-lg opacity-80 mb-2">@{user.login}</p>
                            {user.verified && (
                                <span className="inline-block px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-full">
                                    Verified Developer
                                </span>
                            )}
                        </div>

                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl text-center hover:scale-105 transition-all duration-300">
                                    <div className="text-2xl font-bold text-blue-400">{recentProjects.length}</div>
                                    <div className="text-sm opacity-80">Projects</div>
                                </div>
                            </div>

                            <div className="h-px bg-white/20"></div>




                            <div className="space-y-3 text-sm opacity-80">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="xl:col-span-3 space-y-8">
                        {/* Profile Settings */}
                        <div className={`rounded-2xl p-8 hover:shadow-3xl transition-all duration-500 ${getCardClasses()}`}>
                            <div className="flex flex-row items-center justify-between mb-8">
                                <div>
                                    <h2 className="flex items-center gap-3 text-2xl font-semibold">
                                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                            <Edit3 className="h-5 w-5 text-white" />
                                        </div>
                                        Profile Settings
                                    </h2>
                                    <p className="text-lg opacity-80 mt-2">Manage your account information</p>
                                </div>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition-all duration-300"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSubmit(onSubmit)}
                                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-300"
                                        >
                                            <Save className="h-4 w-4" />
                                            Save Changes
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="flex items-center gap-2 px-6 py-3 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                {isEditing ? (
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="full_name" className="block text-lg font-medium">
                                                    Full Name
                                                </label>

                                                <input
                                                    id="full_name"
                                                    {...register("full_name")}
                                                    className="w-full h-12 px-4 bg-white/5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                                                />
                                                {errors.full_name && <p className="text-sm text-red-400">{errors.full_name.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="login" className="block text-lg font-medium">
                                                    Username
                                                </label>
                                                <input
                                                    id="login"
                                                    {...register("login")}
                                                    className="w-full h-12 px-4 bg-white/5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                                                />
                                                {errors.login && <p className="text-sm text-red-400">{errors.login.message}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="email" className="block text-lg font-medium">
                                                Email
                                            </label>
                                            <input
                                                id="email"
                                                type="email"
                                                {...register("email")}
                                                className="w-full h-12 px-4 bg-white/5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                                            />
                                            {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label htmlFor="password" className="block text-lg font-medium">
                                                    New Password
                                                </label>
                                                <input
                                                    id="password"
                                                    type="password"
                                                    {...register("password")}
                                                    className="w-full h-12 px-4 bg-white/5 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                                                />
                                                {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="passwordConfirmation" className="block text-lg font-medium">
                                                    Confirm Password
                                                </label>
                                                <input
                                                    id="passwordConfirmation"
                                                    type="password"
                                                    {...register("passwordConfirmation")}
                                                    className="w-full h-12 px-4 bg-white/5 border border-gray-300  rounded-lg focus:border-blue-500 focus:outline-none transition-all duration-300"
                                                />
                                                {errors.passwordConfirmation && (
                                                    <p className="text-sm text-red-400">{errors.passwordConfirmation.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-4 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <User className="h-5 w-5 text-blue-400" />
                                                    <span className="text-sm opacity-70">Full Name</span>
                                                </div>
                                                <p className="text-lg font-medium">{user.full_name}</p>
                                            </div>
                                            <div className="p-4 bg-white/5 rounded-xl">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <LogIn className="h-5 w-5 text-purple-400" />
                                                    <span className="text-sm opacity-70">Username</span>
                                                </div>
                                                <p className="text-lg font-medium">{user.login}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-xl">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Mail className="h-5 w-5 text-green-400" />
                                                <span className="text-sm opacity-70">Email</span>
                                            </div>
                                            <p className="text-lg font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>


                        {/* Recent Projects */}
                        {!loading ? (
                            <div className={`rounded-2xl p-8 hover:shadow-3xl transition-all duration-500 ${getCardClasses()}`}>
                                <div className="mb-6">
                                    <h2 className="flex items-center gap-3 text-2xl font-semibold">
                                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                                            <Code className="h-5 w-5 text-white" />
                                        </div>
                                        Recent Projects
                                    </h2>
                                    <p className="text-lg opacity-80 mt-2">Your latest work</p>
                                </div>

                                <div className="space-y-4">
                                    {recentProjects.map((project, index) => (
                                        <div
                                            key={index}
                                            className="group p-6 bg-slate-100 rounded-xl hover:bg-white/10 transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/20"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-4 h-4 rounded-full animate-pulse"
                                                        style={{
                                                            backgroundColor:
                                                                "#" +
                                                                Math.floor(Math.random() * 16777215)
                                                                    .toString(16)
                                                                    .padStart(6, "0"),
                                                        }}
                                                    />
                                                    <div>
                                                        <h4 className="text-lg font-semibold group-hover:text-blue-400 transition-colors duration-300">
                                                            {project.name}
                                                        </h4>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6 text-sm opacity-70">

                                                    <span>{project.updatedAt}</span>

                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-64">
                                <p className="text-gray-500 dark:text-gray-300">Loading recent projects...</p>
                            </div>
                        )}

                        {/* Statistics Section */}
                    </div>
                </div>
            </div>

            <PasswordModal
                open={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onConfirm={onPasswordConfirm}
            />
        </div>
    )
}

export default Profile;
