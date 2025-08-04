import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'en';
  });

  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations = {
  en: {
    nav: {
      schedule: 'Schedule',
      messages: 'Messages',
      recipients: 'Recipients',
      scheduled: 'Scheduled'
    },
    scheduler: {
      title: 'Schedule a WhatsApp Message',
      message: 'Message',
      selectMessage: 'Select a message',
      newMessage: 'New Message',
      newGroup: 'New Group',
      recipientGroup: 'Recipient Group',
      selectGroup: 'Select a group',
      recipients: 'recipients',
      scheduleDateTime: 'Schedule Date & Time',
      selectDateTime: 'Select date and time',
      scheduleButton: 'Schedule Message',
      scheduling: 'Scheduling...',
      createNewMessage: 'Create New Message',
      messageTitle: 'Title',
      content: 'Content',
      createMessage: 'Create Message',
      cancel: 'Cancel',
      successMessage: 'Message scheduled successfully!',
      errorFillFields: 'Please fill in all fields',
      errorSchedule: 'Failed to schedule message',
      errorCreate: 'Failed to create message'
    },
    messages: {
      title: 'Messages',
      searchPlaceholder: 'Search messages...',
      noMessages: 'No messages yet. Create your first message!',
      addFirstMessage: 'Add your first message to get started',
      addMessage: 'Add Message',
      editMessage: 'Edit Message',
      createNewMessage: 'Create New Message',
      messageTitle: 'Title',
      content: 'Content',
      contentPreview: 'Content Preview',
      created: 'Created',
      create: 'Create',
      update: 'Update',
      cancel: 'Cancel',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      loading: 'Loading messages...',
      confirmDelete: 'Are you sure you want to delete this message?',
      enterTitle: 'Enter title...',
      enterContent: 'Enter message content...'
    },
    recipients: {
      title: 'Recipients',
      groups: 'Groups',
      addGroup: 'Add Group',
      groupName: 'Group Name',
      createGroup: 'Create Group',
      editGroup: 'Edit Group',
      updateGroup: 'Update Group',
      cancel: 'Cancel',
      members: 'Members',
      member: 'member',
      addMember: 'Add Member',
      recipientName: 'Name',
      phoneNumber: 'Phone Number',
      save: 'Save',
      noGroups: 'No groups available',
      createFirstGroup: 'Create your first group to manage recipients',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete'
    },
    scheduled: {
      title: 'Scheduled Messages',
      searchPlaceholder: 'Search scheduled messages...',
      noScheduled: 'No scheduled messages',
      scheduleFirst: 'Schedule your first message to see it here',
      message: 'Message',
      group: 'Group',
      scheduledFor: 'Scheduled For',
      status: 'Status',
      actions: 'Actions',
      cancel: 'Cancel',
      statusPending: 'Pending',
      statusSent: 'Sent',
      statusFailed: 'Failed',
      statusCancelled: 'Cancelled'
    }
  },
  es: {
    nav: {
      schedule: 'Programar',
      messages: 'Mensajes',
      recipients: 'Destinatarios',
      scheduled: 'Programados'
    },
    scheduler: {
      title: 'Programar un Mensaje de WhatsApp',
      message: 'Mensaje',
      selectMessage: 'Seleccionar un mensaje',
      newMessage: 'Nuevo Mensaje',
      newGroup: 'Nuevo Grupo',
      recipientGroup: 'Grupo de Destinatarios',
      selectGroup: 'Seleccionar un grupo',
      recipients: 'destinatarios',
      scheduleDateTime: 'Fecha y Hora de Programación',
      selectDateTime: 'Seleccionar fecha y hora',
      scheduleButton: 'Programar Mensaje',
      scheduling: 'Programando...',
      createNewMessage: 'Crear Nuevo Mensaje',
      messageTitle: 'Título',
      content: 'Contenido',
      createMessage: 'Crear Mensaje',
      cancel: 'Cancelar',
      successMessage: '¡Mensaje programado exitosamente!',
      errorFillFields: 'Por favor complete todos los campos',
      errorSchedule: 'Error al programar el mensaje',
      errorCreate: 'Error al crear el mensaje'
    },
    messages: {
      title: 'Mensajes',
      searchPlaceholder: 'Buscar mensajes...',
      noMessages: '¡Aún no hay mensajes. Crea tu primer mensaje!',
      addFirstMessage: 'Agrega tu primer mensaje para comenzar',
      addMessage: 'Agregar Mensaje',
      editMessage: 'Editar Mensaje',
      createNewMessage: 'Crear Nuevo Mensaje',
      messageTitle: 'Título',
      content: 'Contenido',
      contentPreview: 'Vista Previa del Contenido',
      created: 'Creado',
      create: 'Crear',
      update: 'Actualizar',
      cancel: 'Cancelar',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      save: 'Guardar',
      loading: 'Cargando mensajes...',
      confirmDelete: '¿Estás seguro de que quieres eliminar este mensaje?',
      enterTitle: 'Ingresa título...',
      enterContent: 'Ingresa contenido del mensaje...'
    },
    recipients: {
      title: 'Destinatarios',
      groups: 'Grupos',
      addGroup: 'Agregar Grupo',
      groupName: 'Nombre del Grupo',
      createGroup: 'Crear Grupo',
      editGroup: 'Editar Grupo',
      updateGroup: 'Actualizar Grupo',
      cancel: 'Cancelar',
      members: 'Miembros',
      member: 'miembro',
      addMember: 'Agregar Miembro',
      recipientName: 'Nombre',
      phoneNumber: 'Número de Teléfono',
      save: 'Guardar',
      noGroups: 'No hay grupos disponibles',
      createFirstGroup: 'Crea tu primer grupo para gestionar destinatarios',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar'
    },
    scheduled: {
      title: 'Mensajes Programados',
      searchPlaceholder: 'Buscar mensajes programados...',
      noScheduled: 'No hay mensajes programados',
      scheduleFirst: 'Programa tu primer mensaje para verlo aquí',
      message: 'Mensaje',
      group: 'Grupo',
      scheduledFor: 'Programado Para',
      status: 'Estado',
      actions: 'Acciones',
      cancel: 'Cancelar',
      statusPending: 'Pendiente',
      statusSent: 'Enviado',
      statusFailed: 'Fallido',
      statusCancelled: 'Cancelado'
    }
  }
};