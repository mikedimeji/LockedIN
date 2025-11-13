package pomo.Lockedin.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pomo.Lockedin.dao.UserPfpUnlockDao;
import pomo.Lockedin.dao.UserPreferencesDao;
import pomo.Lockedin.dao.UserThemeUnlockDao;
import pomo.Lockedin.dao.impl.GoldTransactionsDao;
import pomo.Lockedin.dto.*;
import pomo.Lockedin.entities.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserPreferencesService {

    private final UserPreferencesDao userPreferencesDao;
    private final UserPfpUnlockDao userPfpUnlockDao;
    private final UserThemeUnlockDao userThemeUnlockDao;
    private final GoldService goldService;
    private final GoldTransactionsDao goldTransactionsDao;

    /**
     * Get user preferences, creating default ones if they don't exist
     */
    public UserPreferencesDTO getUserPreferences(Long userId) {
        Optional<UserPreferences> prefsOpt = userPreferencesDao.getUserPreferencesByUserId(userId);

        UserPreferences prefs;
        if (prefsOpt.isPresent()) {
            prefs = prefsOpt.get();
        } else {
            // Create default preferences
            prefs = userPreferencesDao.createDefaultPreferences(userId);
        }

        return UserPreferencesDTO.builder()
                .selectedPfp(prefs.getSelectedPfp())
                .selectedTheme(prefs.getSelectedTheme())
                .isVideoBackground(prefs.getIsVideoBackground())
                .showLiveThemes(prefs.getShowLiveThemes())
                .navHidden(prefs.getNavHidden())
                .build();
    }

    /**
     * Update user preferences
     */
    @Transactional
    public UserPreferencesDTO updateUserPreferences(Long userId, UserPreferencesDTO preferencesDTO) {
        Optional<UserPreferences> prefsOpt = userPreferencesDao.getUserPreferencesByUserId(userId);

        UserPreferences prefs;
        if (prefsOpt.isPresent()) {
            prefs = prefsOpt.get();
        } else {
            prefs = userPreferencesDao.createDefaultPreferences(userId);
        }

        // Update only non-null fields
        if (preferencesDTO.getSelectedPfp() != null) {
            prefs.setSelectedPfp(preferencesDTO.getSelectedPfp());
        }
        if (preferencesDTO.getSelectedTheme() != null) {
            prefs.setSelectedTheme(preferencesDTO.getSelectedTheme());
        }
        if (preferencesDTO.getIsVideoBackground() != null) {
            prefs.setIsVideoBackground(preferencesDTO.getIsVideoBackground());
        }
        if (preferencesDTO.getShowLiveThemes() != null) {
            prefs.setShowLiveThemes(preferencesDTO.getShowLiveThemes());
        }
        if (preferencesDTO.getNavHidden() != null) {
            prefs.setNavHidden(preferencesDTO.getNavHidden());
        }

        UserPreferences savedPrefs = userPreferencesDao.saveUserPreferences(prefs);

        return UserPreferencesDTO.builder()
                .selectedPfp(savedPrefs.getSelectedPfp())
                .selectedTheme(savedPrefs.getSelectedTheme())
                .isVideoBackground(savedPrefs.getIsVideoBackground())
                .showLiveThemes(savedPrefs.getShowLiveThemes())
                .navHidden(savedPrefs.getNavHidden())
                .build();
    }

    /**
     * Get list of unlocked PFP paths for user
     */
    public List<String> getUnlockedPfps(Long userId) {
        return userPfpUnlockDao.getUnlockedPfpPathsByUserId(userId);
    }

    /**
     * Get list of unlocked theme paths for user
     */
    public List<String> getUnlockedThemes(Long userId) {
        return userThemeUnlockDao.getUnlockedThemePathsByUserId(userId);
    }

    /**
     * Get detailed unlocked items with metadata
     */
    public UnlockedItemsDTO getUnlockedItems(Long userId) {
        List<UserPfpUnlock> pfpUnlocks = userPfpUnlockDao.getUnlockedPfpsByUserId(userId);
        List<UserThemeUnlock> themeUnlocks = userThemeUnlockDao.getUnlockedThemesByUserId(userId);

        List<UnlockedItemDTO> pfps = pfpUnlocks.stream()
                .map(unlock -> UnlockedItemDTO.builder()
                        .path(unlock.getPfpPath())
                        .name(unlock.getPfpName())
                        .goldCost(unlock.getGoldCost())
                        .unlockedDate(unlock.getUnlockedDate())
                        .build())
                .collect(Collectors.toList());

        List<UnlockedItemDTO> themes = themeUnlocks.stream()
                .map(unlock -> UnlockedItemDTO.builder()
                        .path(unlock.getThemePath())
                        .name(unlock.getThemeName())
                        .goldCost(unlock.getGoldCost())
                        .unlockedDate(unlock.getUnlockedDate())
                        .build())
                .collect(Collectors.toList());

        return UnlockedItemsDTO.builder()
                .pfps(pfps)
                .themes(themes)
                .build();
    }

    /**
     * Purchase a PFP with gold
     */
    @Transactional
    public PurchaseResultDTO purchasePfp(Long userId, PurchaseRequestDTO purchaseRequest) {
        // Check if user already owns this PFP
        if (userPfpUnlockDao.existsByUserIdAndPfpPath(userId, purchaseRequest.getItemPath())) {
            throw new IllegalArgumentException("User already owns this PFP");
        }

        // Check if user has enough gold
        if (!canUserAfford(userId, purchaseRequest.getGoldCost())) {
            throw new IllegalArgumentException("Insufficient gold");
        }

        // Deduct gold and record transaction
        int remainingGold = spendGoldForUser(userId, purchaseRequest.getGoldCost(),
                "PFP Purchase: " + purchaseRequest.getItemName());

        // Add PFP unlock
        UserPfpUnlock unlock = UserPfpUnlock.builder()
                .userId(userId)
                .pfpPath(purchaseRequest.getItemPath())
                .pfpName(purchaseRequest.getItemName())
                .goldCost(purchaseRequest.getGoldCost())
                .unlockedDate(LocalDateTime.now())
                .build();

        boolean saved = userPfpUnlockDao.savePfpUnlock(unlock);

        if (!saved) {
            throw new RuntimeException("Failed to save PFP unlock");
        }

        return PurchaseResultDTO.builder()
                .success(true)
                .message("PFP purchased successfully!")
                .remainingGold(remainingGold)
                .itemPath(purchaseRequest.getItemPath())
                .itemName(purchaseRequest.getItemName())
                .build();
    }

    /**
     * Purchase a theme with gold
     */
    @Transactional
    public PurchaseResultDTO purchaseTheme(Long userId, PurchaseRequestDTO purchaseRequest) {
        // Check if user already owns this theme
        if (userThemeUnlockDao.existsByUserIdAndThemePath(userId, purchaseRequest.getItemPath())) {
            throw new IllegalArgumentException("User already owns this theme");
        }

        // Check if user has enough gold
        if (!canUserAfford(userId, purchaseRequest.getGoldCost())) {
            throw new IllegalArgumentException("Insufficient gold");
        }

        // Deduct gold and record transaction
        int remainingGold = spendGoldForUser(userId, purchaseRequest.getGoldCost(),
                "Theme Purchase: " + purchaseRequest.getItemName());

        // Add theme unlock
        UserThemeUnlock unlock = UserThemeUnlock.builder()
                .userId(userId)
                .themePath(purchaseRequest.getItemPath())
                .themeName(purchaseRequest.getItemName())
                .goldCost(purchaseRequest.getGoldCost())
                .unlockedDate(LocalDateTime.now())
                .build();

        boolean saved = userThemeUnlockDao.saveThemeUnlock(unlock);

        if (!saved) {
            throw new RuntimeException("Failed to save theme unlock");
        }

        return PurchaseResultDTO.builder()
                .success(true)
                .message("Theme purchased successfully!")
                .remainingGold(remainingGold)
                .itemPath(purchaseRequest.getItemPath())
                .itemName(purchaseRequest.getItemName())
                .build();
    }

    /**
     * Check if user can afford an item
     */
    public boolean canUserAfford(Long userId, Integer goldCost) {
        int userGold = getUserGoldByUserId(userId);
        return userGold >= goldCost;
    }

    /**
     * Helper method to get user's gold balance by userId
     */
    private int getUserGoldByUserId(Long userId) {
        return goldService.getUserGoldByUserId(userId);
    }

    /**
     * Helper method to spend gold for a user
     */
    private int spendGoldForUser(Long userId, Integer amount, String description) {
        // Deduct gold from user balance
        int newBalance = goldService.spendGoldByUserId(userId, amount);

        // Record the transaction
        goldTransactionsDao.recordTransaction(userId, amount, "SPEND", description);

        return newBalance;
    }
}
