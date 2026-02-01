const Resource = require('../models/resource');

// @desc    Get all active resources
// @route   GET /api/resources
// @access  Public
exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('title description link icon color bgColor category');

    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all resources (including inactive) - for admin
// @route   GET /api/resources/admin
// @access  Private/Admin
exports.getAllResources = async (req, res) => {
  try {
    const resources = await Resource.find({})
      .sort({ order: 1, createdAt: -1 });

    res.json(resources);
  } catch (error) {
    console.error('Error fetching all resources:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create a new resource
// @route   POST /api/resources
// @access  Private/Admin
exports.createResource = async (req, res) => {
  try {
    const {
      title,
      description,
      link,
      icon,
      color,
      bgColor,
      category,
      isActive,
      order
    } = req.body;

    const resource = new Resource({
      title,
      description,
      link,
      icon,
      color,
      bgColor,
      category,
      isActive,
      order
    });

    const savedResource = await resource.save();
    res.status(201).json(savedResource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a resource
// @route   PUT /api/resources/:id
// @access  Private/Admin
exports.updateResource = async (req, res) => {
  try {
    const {
      title,
      description,
      link,
      icon,
      color,
      bgColor,
      category,
      isActive,
      order
    } = req.body;

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        link,
        icon,
        color,
        bgColor,
        category,
        isActive,
        order
      },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json(resource);
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Private/Admin
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle resource active status
// @route   PATCH /api/resources/:id/toggle
// @access  Private/Admin
exports.toggleResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    resource.isActive = !resource.isActive;
    await resource.save();

    res.json(resource);
  } catch (error) {
    console.error('Error toggling resource:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
