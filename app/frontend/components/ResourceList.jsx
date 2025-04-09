import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import { Card, Button, Table, Tag, Tooltip, Space, Pagination, Input, Select } from 'antd';
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from '@ant-design/icons';

const { Option } = Select;

/**
 * ResourceList - Component for displaying available computational resources
 * This component fetches available computational resources from the Calctra platform
 * and displays them in a table with filtering and sorting options.
 */
const ResourceList = () => {
  const { publicKey } = useWallet();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    minCpu: 0,
    minMemory: 0,
    minStorage: 0,
    gpuRequired: false,
    maxPrice: null,
    minReputation: 0,
    location: 'all',
  });
  
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  useEffect(() => {
    // In a real app, this would fetch data from the blockchain
    fetchResources();
  }, [publicKey, filters, pagination.current, pagination.pageSize]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      // Mock data for demo purposes
      // In a real app, this would make a call to a Solana RPC node to fetch on-chain data
      const mockResources = Array.from({ length: 30 }, (_, index) => ({
        id: `resource-${index + 1}`,
        provider: `Provider ${index + 1}`,
        cpuCores: Math.floor(Math.random() * 64) + 2,
        memoryGB: Math.floor(Math.random() * 128) + 4,
        storageGB: Math.floor(Math.random() * 1000) + 100,
        gpuType: Math.random() > 0.3 ? ['NVIDIA RTX 3090', 'NVIDIA RTX 4090', 'AMD Radeon RX 6900 XT'][Math.floor(Math.random() * 3)] : null,
        gpuMemoryGB: Math.random() > 0.3 ? Math.floor(Math.random() * 24) + 8 : 0,
        pricePerHour: (Math.random() * 10).toFixed(2),
        available: Math.random() > 0.2,
        reputationScore: Math.floor(Math.random() * 10) + 1,
        location: ['US', 'EU', 'ASIA'][Math.floor(Math.random() * 3)],
      }));

      // Apply filters
      let filteredResources = mockResources.filter(resource => {
        if (resource.cpuCores < filters.minCpu) return false;
        if (resource.memoryGB < filters.minMemory) return false;
        if (resource.storageGB < filters.minStorage) return false;
        if (filters.gpuRequired && !resource.gpuType) return false;
        if (filters.maxPrice && resource.pricePerHour > filters.maxPrice) return false;
        if (resource.reputationScore < filters.minReputation) return false;
        if (filters.location !== 'all' && resource.location !== filters.location) return false;
        if (searchText && !resource.provider.toLowerCase().includes(searchText.toLowerCase()) && 
            !resource.gpuType?.toLowerCase().includes(searchText.toLowerCase())) {
          return false;
        }
        return true;
      });

      // Update pagination
      setPagination({
        ...pagination,
        total: filteredResources.length,
      });

      // Apply pagination
      const start = (pagination.current - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      filteredResources = filteredResources.slice(start, end);

      setResources(filteredResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value,
    });
    setPagination({
      ...pagination,
      current: 1, // Reset to first page when filters change
    });
  };

  const handleReservation = (resourceId) => {
    if (!publicKey) {
      alert('Please connect your wallet to reserve a resource');
      return;
    }
    // In a real app, this would initiate a blockchain transaction
    console.log(`Reserving resource: ${resourceId}`);
    alert(`Resource ${resourceId} reserved successfully!`);
  };

  const columns = [
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
      sorter: (a, b) => a.provider.localeCompare(b.provider),
    },
    {
      title: 'CPU Cores',
      dataIndex: 'cpuCores',
      key: 'cpuCores',
      sorter: (a, b) => a.cpuCores - b.cpuCores,
    },
    {
      title: 'Memory (GB)',
      dataIndex: 'memoryGB',
      key: 'memoryGB',
      sorter: (a, b) => a.memoryGB - b.memoryGB,
    },
    {
      title: 'Storage (GB)',
      dataIndex: 'storageGB',
      key: 'storageGB',
      sorter: (a, b) => a.storageGB - b.storageGB,
    },
    {
      title: 'GPU',
      dataIndex: 'gpuType',
      key: 'gpuType',
      render: (text, record) => text ? (
        <Tooltip title={`${record.gpuMemoryGB} GB Memory`}>
          {text}
        </Tooltip>
      ) : 'None',
      sorter: (a, b) => {
        if (!a.gpuType && !b.gpuType) return 0;
        if (!a.gpuType) return -1;
        if (!b.gpuType) return 1;
        return a.gpuType.localeCompare(b.gpuType);
      },
    },
    {
      title: 'Price/Hour (CAL)',
      dataIndex: 'pricePerHour',
      key: 'pricePerHour',
      sorter: (a, b) => a.pricePerHour - b.pricePerHour,
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag color={available ? 'green' : 'red'}>
          {available ? 'Available' : 'In Use'}
        </Tag>
      ),
      filters: [
        { text: 'Available', value: true },
        { text: 'In Use', value: false },
      ],
      onFilter: (value, record) => record.available === value,
    },
    {
      title: 'Rating',
      dataIndex: 'reputationScore',
      key: 'reputationScore',
      render: (score) => `${score}/10`,
      sorter: (a, b) => a.reputationScore - b.reputationScore,
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location) => (
        <Tag color={location === 'US' ? 'blue' : location === 'EU' ? 'green' : 'orange'}>
          {location}
        </Tag>
      ),
      filters: [
        { text: 'US', value: 'US' },
        { text: 'EU', value: 'EU' },
        { text: 'ASIA', value: 'ASIA' },
      ],
      onFilter: (value, record) => record.location === value,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          disabled={!record.available || !publicKey}
          onClick={() => handleReservation(record.id)}
        >
          Reserve
        </Button>
      ),
    },
  ];

  return (
    <Card title="Available Computational Resources" className="resource-list-card">
      <div className="filters-container">
        <Space size="middle">
          <Input
            placeholder="Search providers or GPUs"
            prefix={<SearchOutlined />}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250 }}
          />
          
          <Select
            placeholder="Min CPU Cores"
            onChange={(value) => handleFilterChange('minCpu', value)}
            style={{ width: 150 }}
          >
            <Option value={0}>Any</Option>
            <Option value={4}>4+ Cores</Option>
            <Option value={8}>8+ Cores</Option>
            <Option value={16}>16+ Cores</Option>
            <Option value={32}>32+ Cores</Option>
          </Select>
          
          <Select
            placeholder="Min Memory"
            onChange={(value) => handleFilterChange('minMemory', value)}
            style={{ width: 150 }}
          >
            <Option value={0}>Any</Option>
            <Option value={8}>8+ GB</Option>
            <Option value={16}>16+ GB</Option>
            <Option value={32}>32+ GB</Option>
            <Option value={64}>64+ GB</Option>
          </Select>
          
          <Select
            placeholder="GPU Required"
            onChange={(value) => handleFilterChange('gpuRequired', value)}
            style={{ width: 150 }}
          >
            <Option value={false}>Optional</Option>
            <Option value={true}>Required</Option>
          </Select>
          
          <Select
            placeholder="Location"
            onChange={(value) => handleFilterChange('location', value)}
            style={{ width: 150 }}
          >
            <Option value="all">All Locations</Option>
            <Option value="US">US</Option>
            <Option value="EU">EU</Option>
            <Option value="ASIA">ASIA</Option>
          </Select>
        </Space>
      </div>
      
      <Table
        columns={columns}
        dataSource={resources}
        rowKey="id"
        loading={loading}
        pagination={pagination}
        onChange={(pagination, filters, sorter) => {
          setPagination(pagination);
        }}
      />
    </Card>
  );
};

export default ResourceList; 