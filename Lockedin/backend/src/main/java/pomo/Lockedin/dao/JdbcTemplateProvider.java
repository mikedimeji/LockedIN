package pomo.Lockedin.dao;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Interface for DAO implementations that can provide access to JdbcTemplate
 */
public interface JdbcTemplateProvider {
    /**
     * Get the JdbcTemplate instance
     * @return JdbcTemplate instance
     */
    JdbcTemplate getJdbcTemplate();
}