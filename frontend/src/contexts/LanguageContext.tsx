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
      title: 'Recipients & Groups',
      recipients: 'Recipients',
      groups: 'Groups',
      addRecipient: 'Add Recipient',
      addGroup: 'Add Group',
      groupName: 'Group Name',
      createGroup: 'Create Group',
      editGroup: 'Edit Group',
      updateGroup: 'Update Group',
      cancel: 'Cancel',
      members: 'Members',
      member: 'member',
      addMember: 'Add Member',
      name: 'Name',
      recipientName: 'Name',
      phoneNumber: 'Phone Number',
      save: 'Save',
      noGroups: 'No groups available',
      noRecipients: 'No recipients yet',
      noRecipientsDesc: 'Add your first recipient to start sending WhatsApp messages',
      addFirstRecipient: 'Add First Recipient',
      noGroupsYet: 'No groups yet',
      noGroupsDesc: 'Create groups to organize your recipients and send bulk messages',
      createFirstGroup: 'Create First Group',
      actions: 'Actions',
      edit: 'Edit',
      delete: 'Delete',
      none: 'None',
      loading: 'Loading...',
      invalidPhone: 'Please enter a valid phone number with country code (e.g., +1234567890)',
      errorCreateRecipient: 'Error creating recipient',
      errorCreateGroup: 'Error creating group',
      confirmDeleteRecipient: 'Are you sure you want to delete this recipient?',
      confirmDeleteGroup: 'Are you sure you want to delete this group?',
      addToGroups: 'Add to Groups',
      noGroupsAvailable: 'No groups available yet',
      phoneNumberWithCode: 'Phone Number (with country code)',
      phonePlaceholder: '+1 (234) 567-8900',
      validPhoneError: 'Please enter a valid phone number with country code',
      description: 'Description',
      descriptionOptional: 'Description (optional)',
      addRecipients: 'Add Recipients',
      noRecipientsAvailable: 'No recipients available yet'
    },
    scheduled: {
      title: 'Scheduled Messages',
      searchPlaceholder: 'Search scheduled messages...',
      noScheduled: 'No scheduled messages found.',
      scheduleFirst: 'Schedule your first message to see it here',
      message: 'Message',
      group: 'Group',
      scheduledFor: 'Scheduled For',
      scheduledTime: 'Scheduled Time',
      status: 'Status',
      actions: 'Actions',
      cancel: 'Cancel',
      filterByStatus: 'Filter by Status',
      all: 'All',
      statusPending: 'Pending',
      statusSent: 'Sent',
      statusFailed: 'Failed',
      statusCancelled: 'Cancelled',
      statusSending: 'Sending',
      statusPartially_sent: 'Partially Sent',
      statusArchived: 'Archived',
      loading: 'Loading scheduled messages...',
      sent: 'Sent',
      sendNow: 'Send Now',
      confirmCancel: 'Are you sure you want to cancel this scheduled message?',
      confirmSendNow: 'Are you sure you want to send this message immediately?',
      errorCancel: 'Error cancelling message',
      errorSend: 'Error sending message'
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
      title: 'Destinatarios y Grupos',
      recipients: 'Destinatarios',
      groups: 'Grupos',
      addRecipient: 'Agregar Destinatario',
      addGroup: 'Agregar Grupo',
      groupName: 'Nombre del Grupo',
      createGroup: 'Crear Grupo',
      editGroup: 'Editar Grupo',
      updateGroup: 'Actualizar Grupo',
      cancel: 'Cancelar',
      members: 'Miembros',
      member: 'miembro',
      addMember: 'Agregar Miembro',
      name: 'Nombre',
      recipientName: 'Nombre',
      phoneNumber: 'Número de Teléfono',
      save: 'Guardar',
      noGroups: 'No hay grupos disponibles',
      noRecipients: 'Aún no hay destinatarios',
      noRecipientsDesc: 'Agrega tu primer destinatario para comenzar a enviar mensajes de WhatsApp',
      addFirstRecipient: 'Agregar Primer Destinatario',
      noGroupsYet: 'Aún no hay grupos',
      noGroupsDesc: 'Crea grupos para organizar tus destinatarios y enviar mensajes masivos',
      createFirstGroup: 'Crear Primer Grupo',
      actions: 'Acciones',
      edit: 'Editar',
      delete: 'Eliminar',
      none: 'Ninguno',
      loading: 'Cargando...',
      invalidPhone: 'Por favor ingresa un número de teléfono válido con código de país (ej: +1234567890)',
      errorCreateRecipient: 'Error al crear destinatario',
      errorCreateGroup: 'Error al crear grupo',
      confirmDeleteRecipient: '¿Estás seguro de que quieres eliminar este destinatario?',
      confirmDeleteGroup: '¿Estás seguro de que quieres eliminar este grupo?',
      addToGroups: 'Agregar a Grupos',
      noGroupsAvailable: 'Aún no hay grupos disponibles',
      phoneNumberWithCode: 'Número de Teléfono (con código de país)',
      phonePlaceholder: '+52 (662) 123-4567',
      validPhoneError: 'Por favor ingresa un número de teléfono válido con código de país',
      description: 'Descripción',
      descriptionOptional: 'Descripción (opcional)',
      addRecipients: 'Agregar Destinatarios',
      noRecipientsAvailable: 'Aún no hay destinatarios disponibles'
    },
    scheduled: {
      title: 'Mensajes Programados',
      searchPlaceholder: 'Buscar mensajes programados...',
      noScheduled: 'No se encontraron mensajes programados.',
      scheduleFirst: 'Programa tu primer mensaje para verlo aquí',
      message: 'Mensaje',
      group: 'Grupo',
      scheduledFor: 'Programado Para',
      scheduledTime: 'Hora Programada',
      status: 'Estado',
      actions: 'Acciones',
      cancel: 'Cancelar',
      filterByStatus: 'Filtrar por Estado',
      all: 'Todos',
      statusPending: 'Pendiente',
      statusSent: 'Enviado',
      statusFailed: 'Fallido',
      statusCancelled: 'Cancelado',
      statusSending: 'Enviando',
      statusPartially_sent: 'Parcialmente Enviado',
      statusArchived: 'Archivado',
      loading: 'Cargando mensajes programados...',
      sent: 'Enviado',
      sendNow: 'Enviar Ahora',
      confirmCancel: '¿Estás seguro de que quieres cancelar este mensaje programado?',
      confirmSendNow: '¿Estás seguro de que quieres enviar este mensaje inmediatamente?',
      errorCancel: 'Error al cancelar mensaje',
      errorSend: 'Error al enviar mensaje'
    }
  }
};