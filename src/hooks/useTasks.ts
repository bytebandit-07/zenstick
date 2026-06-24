import { useState, useEffect } from 'react';
import { getDb } from '../db/database';
import { WidgetTask } from '../types';

export function useTasks() {
  const [tasks, setTasks] = useState<WidgetTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Database se tasks load karna
  const loadTasks = async () => {
    try {
      const db = await getDb();
      const result = await db.select<any[]>('SELECT * FROM widget_tasks ORDER BY order_index ASC, created_at DESC');
      
      const formattedTasks: WidgetTask[] = result.map(row => ({
        id: row.id,
        content: row.content,
        isCompleted: row.is_completed === 1,
        orderIndex: row.order_index,
        createdAt: new Date(row.created_at)
      }));
      
      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Jab hook pehli dafa chale, tasks load kar lo
  useEffect(() => {
    loadTasks();
  }, []);

  // 2. Naya task add karna
  const addTask = async (content: string) => {
    try {
      const db = await getDb();
      const id = crypto.randomUUID();
      const orderIndex = tasks.length; // List ke aakhir mein add hoga
      
      await db.execute(
        'INSERT INTO widget_tasks (id, content, is_completed, order_index) VALUES ($1, $2, 0, $3)',
        [id, content, orderIndex]
      );
      await loadTasks(); // DB update hone ke baad fresh list load karo
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  // 3. Task ko Tick/Untick (Complete) karna
  const toggleTask = async (id: string, currentStatus: boolean) => {
    try {
      const db = await getDb();
      await db.execute(
        'UPDATE widget_tasks SET is_completed = $1 WHERE id = $2',
        [currentStatus ? 0 : 1, id]
      );
      await loadTasks();
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  // 4. Task Delete karna
  const deleteTask = async (id: string) => {
    try {
      const db = await getDb();
      await db.execute('DELETE FROM widget_tasks WHERE id = $1', [id]);
      await loadTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  return { tasks, isLoading, addTask, toggleTask, deleteTask };
}