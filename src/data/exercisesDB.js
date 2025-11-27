// Banco de dados de exercícios organizados por grupos musculares
export const exercisesDB = {
  'Peito': [
    'Supino Reto',
    'Supino Inclinado',
    'Supino Declinado',
    'Supino com Halteres',
    'Supino Inclinado com Halteres',
    'Crucifixo',
    'Crucifixo Inclinado',
    'Crucifixo Declinado',
    'Peck Deck',
    'Cross Over',
    'Flexão de Braço',
    'Flexão Inclinada',
    'Flexão Declinada',
    'Paralelas',
    'Supino Máquina',
    'Voador'
  ],
  'Costas': [
    'Puxada Frontal',
    'Puxada Aberta',
    'Puxada Fechada',
    'Puxada Alta',
    'Remada Curvada',
    'Remada Baixa',
    'Remada Unilateral',
    'Remada com Halteres',
    'Remada Máquina',
    'Remada Cavalinho',
    'Serrote',
    'Levantamento Terra',
    'Barra Fixa',
    'Puxada no Pulley',
    'Remada Alta',
    'Encolhimento de Ombros'
  ],
  'Ombro': [
    'Desenvolvimento',
    'Desenvolvimento com Halteres',
    'Elevação Lateral',
    'Elevação Frontal',
    'Crucifixo Invertido',
    'Crucifixo Máquina',
    'Elevação Lateral Unilateral',
    'Desenvolvimento Arnold',
    'Elevação Lateral Sentado',
    'Remada Alta',
    'Crucifixo Invertido no Cross',
    'Desenvolvimento no Smith',
    'Elevação Lateral com Cabo'
  ],
  'Bíceps': [
    'Rosca Direta',
    'Rosca Alternada',
    'Rosca Martelo',
    'Rosca Concentrada',
    'Rosca 21',
    'Rosca Scott',
    'Rosca no Banco',
    'Rosca com Cabo',
    'Rosca Inversa',
    'Barra W',
    'Rosca Unilateral',
    'Rosca Spider',
    'Rosca com Halteres'
  ],
  'Tríceps': [
    'Tríceps Testa',
    'Tríceps Pulley',
    'Tríceps Corda',
    'Tríceps Francês',
    'Tríceps Coice',
    'Paralelas',
    'Supino Fechado',
    'Tríceps Mergulho',
    'Tríceps Máquina',
    'Tríceps Kickback',
    'Tríceps Unilateral',
    'Tríceps Overhead',
    'Diamond Push-up'
  ],
  'Pernas': [
    'Agachamento Livre',
    'Agachamento no Smith',
    'Agachamento Sumô',
    'Agachamento Bulgaro',
    'Agachamento Frontal',
    'Leg Press 45°',
    'Leg Press Horizontal',
    'Hack Squat',
    'Extensão de Pernas',
    'Flexão de Pernas',
    'Mesa Flexora',
    'Stiff',
    'Levantamento Terra Romeno',
    'Passada',
    'Afundo',
    'Leg Curl',
    'Agachamento com Salto',
    'Cadeira Extensora',
    'Cadeira Flexora'
  ],
  'Glúteos': [
    'Elevação Pélvica',
    'Glúteo Máquina',
    'Glúteo com Caneleira',
    'Abdução de Quadril',
    'Adução de Quadril',
    'Agachamento Sumô',
    'Afundo',
    'Levantamento Terra',
    'Stiff',
    'Leg Press Glúteo',
    'Ponte Glúteo',
    'Coice no Cross'
  ],
  'Panturrilha': [
    'Panturrilha em Pé',
    'Panturrilha Sentado',
    'Panturrilha Unilateral',
    'Panturrilha no Leg Press',
    'Panturrilha no Hack',
    'Panturrilha no Smith',
    'Panturrilha no Step'
  ],
  'Abdômen': [
    'Abdominal Reto',
    'Abdominal Inclinado',
    'Abdominal Infra',
    'Abdominal Oblíquo',
    'Prancha',
    'Prancha Lateral',
    'Russian Twist',
    'Abdominal Bicicleta',
    'Elevação de Pernas',
    'Abdominal na Máquina',
    'Mountain Climber',
    'Abdominal Canivete',
    'Crunch',
    'Burpee'
  ],
  'Antebraço': [
    'Rosca de Punho',
    'Rosca Inversa de Punho',
    'Rosca de Punho com Barra',
    'Rosca de Punho com Halteres',
    'Grip Training',
    'Farmer Walk'
  ],
  'Cardio': [
    'Esteira',
    'Bicicleta Ergométrica',
    'Elíptico',
    'Transport',
    'Corda',
    'Remo',
    'Corrida',
    'Caminhada',
    'HIIT',
    'Cycling'
  ]
}

// Função auxiliar para obter todos os grupos musculares
export const getMuscleGroups = () => {
  return Object.keys(exercisesDB)
}

// Função auxiliar para obter exercícios de um grupo específico
export const getExercisesByGroup = (group) => {
  return exercisesDB[group] || []
}

// Função auxiliar para buscar um exercício em todos os grupos
export const findExercise = (exerciseName) => {
  for (const [group, exercises] of Object.entries(exercisesDB)) {
    if (exercises.includes(exerciseName)) {
      return group
    }
  }
  return null
}



