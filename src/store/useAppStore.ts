import { create } from "zustand";
import { supabase } from "../../supabaseClient";
import { User, Task } from "../types";

interface AppState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tasks: Task[];

  // Auth
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  initAuth: () => Promise<void>;

  // Tasks
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, status: Task["status"]) => Promise<void>;

  // Dashboard
  getDashboardStats: () => {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    completionRate: number;
    tasksByUser: Array<{ userName: string; count: number }>;
    tasksByPriority: Array<{ priority: 'high' | 'medium' | 'low'; count: number }>;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  tasks: [],

  // =========================
  // LOGIN
  // =========================
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Response status:', response.status, 'Response data:', data);

      if (!response.ok) {
        console.error("Erro login:", data.error);
        set({ isLoading: false });
        return { success: false, error: data.error || 'Credenciais inválidas' };
      }

      // Salvar token no localStorage
      localStorage.setItem('token', data.token);

      set({
        currentUser: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: "user",
          avatar: data.user.name[0].toUpperCase(),
        },
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      console.error("Erro login:", error);
      set({ isLoading: false });
      return { success: false, error: 'Erro ao conectar com o servidor' };
    }
  },

  // =========================
  // REGISTER
  // =========================
  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erro registro:", data.error);
        set({ isLoading: false });
        return false;
      }

      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error("Erro registro:", error);
      set({ isLoading: false });
      return false;
    }
  },

  // =========================
  // LOGOUT
  // =========================
  logout: async () => {
    localStorage.removeItem('token');
    set({ currentUser: null, isAuthenticated: false });
  },

  // =========================
  // INIT AUTH (persist session)
  // =========================
  initAuth: async () => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('token');

      if (!token) {
        set({ currentUser: null, isAuthenticated: false, isLoading: false });
        return;
      }

      // Verificar token com o backend
      try {
        const response = await fetch('http://localhost:3000/auth/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const user = await response.json();
          set({
            currentUser: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: "user",
              avatar: user.name[0].toUpperCase(),
            },
            isAuthenticated: true,
          });
          // Fetch initial data only (no users dependency)
          await get().fetchTasks();
        } else {
          // Token inválido, limpar
          localStorage.removeItem('token');
          set({ currentUser: null, isAuthenticated: false });
        }
      } catch (error) {
        console.error("Erro ao verificar token:", error);
        localStorage.removeItem('token');
        set({ currentUser: null, isAuthenticated: false });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // =========================
  // TASKS
  // =========================
  fetchTasks: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.from("tasks").select("*");
    if (error) {
      console.error("Erro fetchTasks:", error.message);
    } else {
      // Map DB snake_case -> app camelCase
      const tasks = (data as any[]).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assigned_to ?? t.assignedTo ?? undefined,
        createdBy: t.created_by ?? t.createdBy ?? null,
        dueDate: t.due_date ?? t.dueDate ?? undefined,
        createdAt: t.created_at ?? t.createdAt ?? new Date().toISOString(),
        updatedAt: t.updated_at ?? t.updatedAt ?? new Date().toISOString(),
      })) as Task[];
      set({ tasks });
    }
    set({ isLoading: false });
  },

  addTask: async (task) => {
    const isUuid = (v: unknown) =>
      typeof v === "string" &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(v);

    let dueDateValue = null;
    if (task.dueDate instanceof Date && !isNaN(task.dueDate.getTime())) {
      // ✅ Só envia se for data válida e dentro do intervalo normal
      const year = task.dueDate.getFullYear();
      if (year > 1900 && year < 2100) {
        dueDateValue = task.dueDate.toISOString();
      }
    } else if (typeof task.dueDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(task.dueDate)) {
      dueDateValue = task.dueDate;
    }

    const payload: any = {
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      assigned_to: isUuid(task.assignedTo) ? task.assignedTo : null,
      created_by: task.createdBy ?? null,
      due_date: dueDateValue,
    };

    const { data, error } = await supabase.from("tasks").insert([payload]).select();
    if (error) console.error("Erro addTask:", error.message);
    else if (data) {
      const inserted = data[0];
      set({ tasks: [...get().tasks, inserted] });
    }
  },


  updateTask: async (id, updates) => {
    // Map camelCase partial updates -> snake_case
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.assignedTo !== undefined) payload.assigned_to = updates.assignedTo;
    if (updates.createdBy !== undefined) payload.created_by = updates.createdBy;
    if (updates.dueDate !== undefined) {
      payload.due_date = updates.dueDate instanceof Date ? updates.dueDate.toISOString() : updates.dueDate;
    }

    const { data, error } = await supabase.from("tasks").update(payload).eq("id", id).select();
    if (!error && data) {
      set({
        tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      });
    } else if (error) {
      console.error("Erro updateTask:", error.message);
    }
  },

  deleteTask: async (id) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      set({ tasks: get().tasks.filter((t) => t.id !== id) });
    } else {
      console.error("Erro deleteTask:", error.message);
    }
  },

  // Move task between columns (status change)
  moveTask: async (id, status) => {
    await get().updateTask(id, { status });
  },

  // (Users dependency removed)

  // =========================
  // DASHBOARD STATS
  // =========================
  getDashboardStats: () => {
    
    const { tasks } = get();
    console.log(tasks)
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
    const todoTasks = tasks.filter(task => task.status === 'todo').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Agrupar tarefas por usuário
    const tasksByUserCount = tasks.reduce<Record<string, number>>((acc, task) => {
      const label = task.assignedTo ? task.assignedTo : 'Não atribuído';
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    // Agrupar tarefas por prioridade
    const tasksByPriority = tasks.reduce<Record<string, number>>((acc, task) => {
      const priority = task.priority || 'medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate,
      tasksByUser: Object.entries(tasksByUserCount).map(([userName, count]) => ({
        userName,
        count,
      })),
      tasksByPriority: [
        { priority: 'high', count: tasksByPriority.high || 0 },
        { priority: 'medium', count: tasksByPriority.medium || 0 },
        { priority: 'low', count: tasksByPriority.low || 0 },
      ],
    };
  },
}));
