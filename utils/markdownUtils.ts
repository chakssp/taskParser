import { GeneratedTask } from '../types';

export const parseMarkdownToTasks = (markdown: string): GeneratedTask[] => {
  const tasks: GeneratedTask[] = [];
  const lines = markdown.split('\n');
  let currentFeature = 'General';
  let currentTask: Partial<GeneratedTask> | null = null;
  let collectingDescription = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('### Feature:')) {
      if (currentTask) {
        tasks.push(currentTask as GeneratedTask);
        currentTask = null;
      }
      currentFeature = trimmed.replace('### Feature:', '').trim();
      collectingDescription = false;
      continue;
    }

    if (trimmed.startsWith('**Task ID:**')) {
      if (currentTask) {
        tasks.push(currentTask as GeneratedTask);
      }
      const idMatch = trimmed.match(/`([^`]+)`/);
      currentTask = {
        uuid: idMatch ? idMatch[1] : '',
        feature: currentFeature,
        description: '',
        status: 'todo',
        order: 0,
        title: 'Untitled Task',
        created: new Date().toISOString().slice(0, 10)
      };
      collectingDescription = false;
      continue;
    }

    if (currentTask) {
      if (trimmed.startsWith('**Título:**')) {
        currentTask.title = trimmed.replace('**Título:**', '').trim();
      } else if (trimmed.startsWith('**Status:**')) {
        currentTask.status = trimmed.replace('**Status:**', '').trim().toLowerCase();
      } else if (trimmed.startsWith('**Ordem:**')) {
        const orderStr = trimmed.replace('**Ordem:**', '').trim();
        currentTask.order = parseInt(orderStr) || 0;
      } else if (trimmed.startsWith('**Criado:**')) {
        currentTask.created = trimmed.replace('**Criado:**', '').trim();
      } else if (trimmed.startsWith('**Descrição:**')) {
        collectingDescription = true;
      } else if (collectingDescription) {
        // Stop description if we hit a new known marker
        if (trimmed.startsWith('##') || trimmed.startsWith('**Task ID:**')) {
          collectingDescription = false;
        } else {
          currentTask.description += line + '\n'; // Keep original line to preserve formatting
        }
      }
    }
  }

  if (currentTask) {
    tasks.push(currentTask as GeneratedTask);
  }

  return tasks;
};

export const generateMarkdownFromTasks = (tasks: GeneratedTask[]): string => {
  const grouped: Record<string, GeneratedTask[]> = {};
  
  // Group tasks
  tasks.forEach(t => {
    const feat = t.feature || 'General';
    if (!grouped[feat]) grouped[feat] = [];
    grouped[feat].push(t);
  });

  let md = `## 📋 Tasks Extraídas (Total: ${tasks.length})\n\n`;

  Object.keys(grouped).forEach(feature => {
    md += `### Feature: ${feature}\n`;
    grouped[feature].forEach(task => {
      md += `**Task ID:** \`${task.uuid}\`\n`;
      md += `**Título:** ${task.title}\n`;
      md += `**Status:** ${task.status}\n`;
      md += `**Ordem:** ${task.order}\n`;
      md += `**Criado:** ${task.created}\n`;
      md += `**Descrição:**\n${task.description ? task.description.trim() : ''}\n\n`;
    });
  });

  return md;
};
