const ProductionEmployee = require('../models/ProductionEmployee');

// Listar todos os funcionários de produção
exports.getEmployees = async (req, res) => {
  try {
    const { role, availability, active } = req.query;
    const filters = {};

    if (role) {
      filters.role = role;
    }

    if (availability) {
      filters.availability = availability;
    }

    if (active !== undefined) {
      filters.active = active === 'true';
    }

    const employees = await ProductionEmployee.find(filters).sort({ name: 1 });
    res.json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar funcionários',
      error: error.message,
    });
  }
};

// Buscar um funcionário por ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await ProductionEmployee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar funcionário',
      error: error.message,
    });
  }
};

// Criar novo funcionário
exports.createEmployee = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      role, 
      availability, 
      skills, 
      hireDate, 
      notes 
    } = req.body;

    if (!name || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome e função são obrigatórios' 
      });
    }

    const employee = await ProductionEmployee.create({
      name,
      email,
      phone,
      role,
      availability: availability || 'available',
      skills: skills || [],
      hireDate,
      notes,
      active: true,
    });

    res.status(201).json({ 
      success: true, 
      message: 'Funcionário criado com sucesso', 
      data: employee 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao criar funcionário',
      error: error.message,
    });
  }
};

// Atualizar funcionário
exports.updateEmployee = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      role, 
      availability, 
      skills, 
      hireDate, 
      notes,
      active 
    } = req.body;

    const employee = await ProductionEmployee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    // Atualizar campos se fornecidos
    if (name !== undefined) employee.name = name;
    if (email !== undefined) employee.email = email;
    if (phone !== undefined) employee.phone = phone;
    if (role !== undefined) employee.role = role;
    if (availability !== undefined) employee.availability = availability;
    if (skills !== undefined) employee.skills = skills;
    if (hireDate !== undefined) employee.hireDate = hireDate;
    if (notes !== undefined) employee.notes = notes;
    if (active !== undefined) employee.active = active;

    await employee.save();

    res.json({ 
      success: true, 
      message: 'Funcionário atualizado com sucesso', 
      data: employee 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar funcionário',
      error: error.message,
    });
  }
};

// Deletar funcionário (soft delete - marca como inativo)
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await ProductionEmployee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    employee.active = false;
    await employee.save();

    res.json({ 
      success: true, 
      message: 'Funcionário desativado com sucesso' 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar funcionário',
      error: error.message,
    });
  }
};

// Atribuir funcionário a uma tarefa
exports.assignToTask = async (req, res) => {
  try {
    const { taskId, taskType } = req.body;

    if (!taskId || !taskType) {
      return res.status(400).json({ 
        success: false, 
        message: 'TaskId e taskType são obrigatórios' 
      });
    }

    if (!['delivery_route', 'service_order'].includes(taskType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'taskType deve ser "delivery_route" ou "service_order"' 
      });
    }

    const employee = await ProductionEmployee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    if (!employee.active) {
      return res.status(400).json({ 
        success: false, 
        message: 'Funcionário está inativo' 
      });
    }

    await employee.assignToTask(taskId, taskType);

    res.json({ 
      success: true, 
      message: 'Funcionário atribuído à tarefa com sucesso', 
      data: employee 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao atribuir funcionário à tarefa',
      error: error.message,
    });
  }
};

// Liberar funcionário de uma tarefa
exports.releaseFromTask = async (req, res) => {
  try {
    const employee = await ProductionEmployee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: 'Funcionário não encontrado' 
      });
    }

    await employee.releaseFromTask();

    res.json({ 
      success: true, 
      message: 'Funcionário liberado da tarefa com sucesso', 
      data: employee 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro ao liberar funcionário da tarefa',
      error: error.message,
    });
  }
};

